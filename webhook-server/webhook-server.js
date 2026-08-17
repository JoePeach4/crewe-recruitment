import express from 'express'

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const PORT = process.env.PORT || 3000

if (!JOTFORM_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables: JOTFORM_API_KEY, SUPABASE_URL, SUPABASE_KEY')
  process.exit(1)
}

// Field IDs are identical across all 7 forms EXCEPT the "Player" field,
// which is 57 on Goalkeeper/Centre Back and 56 everywhere else (verified
// directly against each form's question schema via the JotForm API).
const FORM_POSITIONS = {
  '222285725346358': 'Goalkeeper',
  '221034419719050': 'Centre Back',
  '222285688293367': 'Full Back',
  '221114334342340': 'Centre Midfielder',
  '222372072545351': 'Attacking Midfielder',
  '222372120671345': 'Wide Forward',
  '222372051361344': 'Centre Forward',
}

const PLAYER_FIELD_ID = {
  '222285725346358': '57', // Goalkeeper
  '221034419719050': '57', // Centre Back
  '222285688293367': '56', // Full Back
  '221114334342340': '56', // Centre Midfielder
  '222372072545351': '56', // Attacking Midfielder
  '222372120671345': '56', // Wide Forward
  '222372051361344': '56', // Centre Forward
}

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

let scoutBandsCache = null
let scoutBandsCacheAt = 0
const SCOUT_BANDS_TTL_MS = 5 * 60 * 1000

async function getScoutRating(firstName, lastName) {
  if (!firstName || !lastName) return 1
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const now = Date.now()
  if (!scoutBandsCache || now - scoutBandsCacheAt > SCOUT_BANDS_TTL_MS) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scout_bands?select=scout_initials,rating`, {
      headers: supabaseHeaders,
    })
    const rows = await res.json()
    scoutBandsCache = new Map(rows.map((r) => [String(r.scout_initials).trim().toUpperCase(), r.rating]))
    scoutBandsCacheAt = now
  }
  return scoutBandsCache.get(initials) ?? 1
}

function parseDate(raw) {
  if (!raw) return new Date().toISOString().slice(0, 10)
  if (typeof raw === 'object') {
    if (raw.datetime) return String(raw.datetime).split(' ')[0]
    if (raw.year && raw.month && raw.day) {
      return `${raw.year}-${String(raw.month).padStart(2, '0')}-${String(raw.day).padStart(2, '0')}`
    }
  }
  return String(raw).split(' ')[0]
}

async function fetchSubmission(submissionId) {
  const url = `https://eu-api.jotform.com/submission/${submissionId}?apiKey=${JOTFORM_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.responseCode !== 200) {
    throw new Error(`JotForm API error: ${JSON.stringify(data)}`)
  }
  return data.content
}

// Mirrors the field-ID mapping in import_jotform_reports.py — keep both in sync.
async function parseSubmission(sub, formId, position) {
  const ans = sub.answers || {}

  const player = ans[PLAYER_FIELD_ID[formId] ?? '56']?.answer ?? 'Unknown'
  const dateStr = parseDate(ans['18']?.answer)
  const current = ans['48']?.answer
  const potential = ans['49']?.answer
  const verdict = ans['51']?.answer
  const team = ans['14']?.answer
  const oppositionTeam = ans['16']?.answer

  const scout = ans['3']?.answer
  const scoutFirst = scout && typeof scout === 'object' ? scout.first : null
  const scoutLast = scout && typeof scout === 'object' ? scout.last : null

  const scoutRating = await getScoutRating(scoutFirst, scoutLast)

  const report = {
    player_name: String(player),
    fixture_date: dateStr,
    current_playing_level: current ? String(current) : null,
    potential_playing_level: potential ? String(potential) : null,
    verdict: verdict ? String(verdict) : null,
    scout_first_name: scoutFirst ? String(scoutFirst) : null,
    scout_last_name: scoutLast ? String(scoutLast) : null,
    team: team ? String(team).trim().toLowerCase() : null,
    opposition_team: oppositionTeam ? String(oppositionTeam).trim().toLowerCase() : null,
    report_position: position,
    form_id: formId,
    jotform_submission_id: sub.id,
    report_date: (sub.created_at || '').split(' ')[0] || new Date().toISOString().slice(0, 10),
    scout_rating: scoutRating,
    report_weight: 0.1,
  }

  return Object.fromEntries(Object.entries(report).filter(([, v]) => v !== null && v !== undefined))
}

// Returns true if a new row was inserted, false if skipped as a duplicate.
async function insertReport(report) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: 'POST',
    headers: { ...supabaseHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify([report]),
  })

  if (res.status === 409) {
    console.log(`⚠ Duplicate submission ignored: ${report.jotform_submission_id}`)
    return false
  }
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase insert failed (${res.status}): ${body}`)
  }
  return true
}

const app = express()
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use(express.json({ limit: '5mb' }))

app.post('/webhook/jotform', async (req, res) => {
  try {
    const formId = req.body.formID
    const submissionId = req.body.submissionID

    if (!formId || !submissionId) {
      console.error('Webhook missing formID/submissionID:', req.body)
      return res.status(400).json({ error: 'Missing formID or submissionID' })
    }

    const position = FORM_POSITIONS[formId]
    if (!position) {
      console.error('Unknown form ID:', formId)
      // 200 so JotForm doesn't treat this as a failure and keep retrying.
      return res.status(200).json({ ok: false, reason: 'unknown form' })
    }

    const sub = await fetchSubmission(submissionId)
    const report = await parseSubmission(sub, formId, position)
    const inserted = await insertReport(report)

    if (inserted) {
      console.log(`✓ Report inserted: ${report.player_name} (${position})`)
    }
    res.status(200).json({ ok: true, inserted })
  } catch (err) {
    console.error('✗ Webhook error:', err)
    // 200 to avoid JotForm retry storms; the error is logged for visibility.
    res.status(200).json({ ok: false, error: String(err) })
  }
})

app.post('/test', async (_req, res) => {
  const testReport = {
    player_name: 'Test Player',
    fixture_date: new Date().toISOString().slice(0, 10),
    verdict: 'Watch again - ASAP',
    report_position: 'Centre Back',
    form_id: 'test',
    jotform_submission_id: `test-${Date.now()}`,
    report_date: new Date().toISOString().slice(0, 10),
    scout_rating: 1,
    report_weight: 0.1,
    team: 'test fc',
    opposition_team: 'test opposition',
  }
  try {
    await insertReport(testReport)
    res.json({ ok: true, report: testReport })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
})

app.get('/', (_req, res) => {
  res.send('Crewe Alexandra JotForm webhook server is running.')
})

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`)
  console.log(`✓ Webhook endpoint: http://localhost:${PORT}/webhook/jotform`)
})

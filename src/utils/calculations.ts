import type { Report, LevelResult } from '../types'

// 13-tier scale reflecting the actual granularity scouts record (Upper/Lower
// sub-bands within League One/Two/National League, plus non-league steps),
// lowest to highest. Confirmed with the club — see PROJECT handover notes.
export const levelScores: Record<string, number> = {
  'Below National League': 1,
  'Non-League Step 4': 2,
  'Non-League Step 3': 3,
  'National League North/South': 4,
  'Lower National League': 5,
  'National League': 6,
  'Upper National League': 7,
  'Lower League 2': 8,
  'Upper League 2': 9,
  'Lower League 1': 10,
  'Upper League 1': 11,
  Championship: 12,
  'Premier League': 13,
}

// Inconsistent labels seen in the source data that mean the same tier.
const levelSynonyms: Record<string, string> = {
  'Step 3': 'Non-League Step 3',
  'National League N/S': 'National League North/South',
}

const levelsByScore: [number, string][] = Object.entries(levelScores)
  .map(([level, score]): [number, string] => [score, level])
  .sort((a, b) => a[0] - b[0])

const MIN_SCORE = levelsByScore[0][0]
const MAX_SCORE = levelsByScore[levelsByScore.length - 1][0]

export function normalizeLevel(level: string | null | undefined): string | null {
  if (!level) return null
  return levelSynonyms[level] ?? level
}

export function convertLevelToScore(level: string | null | undefined): number | null {
  const normalized = normalizeLevel(level)
  if (!normalized) return null
  return levelScores[normalized] ?? null
}

export function calculateTimeDecay(fixtureDate: string | null | undefined): number {
  if (!fixtureDate) return 0
  const fixtureTime = new Date(fixtureDate).getTime()
  if (Number.isNaN(fixtureTime)) return 0
  const daysOld = Math.max(0, (Date.now() - fixtureTime) / (1000 * 60 * 60 * 24))
  return Math.max(100, 450 - daysOld) / 450
}

// Player records split full-backs into "Left Back"/"Right Back"; reports
// record them jointly as "Full Back". Normalize both to the same bucket
// before comparing so the position multiplier still recognizes a match.
function normalizePositionForMatch(position: string | null | undefined): string | null {
  if (!position) return null
  if (position === 'Left Back' || position === 'Right Back') return 'Full Back'
  return position
}

export function calculateWeight(
  scoutRating: number | null | undefined,
  fixtureDate: string | null | undefined,
  playerPosition: string | null | undefined,
  reportPosition: string | null | undefined,
): number {
  const rating = scoutRating ?? 1
  const timeDecay = calculateTimeDecay(fixtureDate)
  const normalizedPlayerPos = normalizePositionForMatch(playerPosition)
  const normalizedReportPos = normalizePositionForMatch(reportPosition)
  const positionMultiplier =
    normalizedPlayerPos && normalizedReportPos && normalizedPlayerPos === normalizedReportPos ? 1 : 0.5
  return rating * timeDecay * positionMultiplier
}

export function getWeightedAverageLevel(
  reports: Report[],
  levelField: 'current_playing_level' | 'potential_playing_level',
  playerPosition: string | null | undefined,
): LevelResult {
  let weightedSum = 0
  let weightTotal = 0

  for (const report of reports) {
    const score = convertLevelToScore(report[levelField])
    if (score === null) continue

    const weight = calculateWeight(
      report.scout_rating,
      report.fixture_date,
      playerPosition,
      report.report_position,
    )
    if (weight <= 0) continue

    weightedSum += score * weight
    weightTotal += weight
  }

  if (weightTotal === 0) {
    return { level: null, score: 0, nextLevel: null, distance: 0 }
  }

  const avgScore = Math.min(Math.max(weightedSum / weightTotal, MIN_SCORE), MAX_SCORE)
  const floorScore = Math.floor(avgScore)
  const atTop = floorScore >= MAX_SCORE

  const currentLevel = levelsByScore.find(([s]) => s === (atTop ? MAX_SCORE : floorScore))?.[1] ?? null
  const nextLevel = atTop ? null : levelsByScore.find(([s]) => s === floorScore + 1)?.[1] ?? null

  const normalized = atTop ? 100 : (avgScore - floorScore) * 100

  return {
    level: currentLevel,
    score: Math.round(normalized),
    nextLevel,
    distance: Math.round(100 - normalized),
  }
}

export function getConfidence(reportCount: number): number {
  return Math.min(100, Math.round((reportCount / 10) * 100))
}

export interface VerdictBreakdown {
  sign: number
  watch: number
  forget: number
  total: number
}

// Verdicts in the source data are free-form variants like "Sign for first
// team", "Watch again - ASAP", etc. Bucket by prefix rather than exact match.
export function getVerdictBucket(verdict: string | null | undefined): 'Sign' | 'Watch' | 'Forget' | null {
  if (!verdict) return null
  const trimmed = verdict.trim()
  if (trimmed.startsWith('Sign')) return 'Sign'
  if (trimmed.startsWith('Watch')) return 'Watch'
  if (trimmed.startsWith('Forget')) return 'Forget'
  return null
}

export function getVerdictBreakdown(reports: Report[]): VerdictBreakdown {
  let sign = 0
  let watch = 0
  let forget = 0

  for (const report of reports) {
    const bucket = getVerdictBucket(report.verdict)
    if (bucket === 'Sign') sign++
    else if (bucket === 'Watch') watch++
    else if (bucket === 'Forget') forget++
  }

  return { sign, watch, forget, total: sign + watch + forget }
}

export type Consensus = 'Positive' | 'Mixed' | 'Watch Again' | 'Negative'

export function getConsensus(breakdown: VerdictBreakdown): Consensus {
  const { sign, watch, forget } = breakdown
  if (sign === 0 && watch === 0 && forget === 0) return 'Mixed'
  if (sign > watch + forget) return 'Positive'
  if (forget > sign + watch) return 'Negative'
  if (watch > sign && watch > forget) return 'Watch Again'
  return 'Mixed'
}

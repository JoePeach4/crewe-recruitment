import type { Player, Report } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY environment variables')
}

const PAGE_SIZE = 1000
const REQUEST_TIMEOUT_MS = 30000

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: { ...supabaseHeaders, ...init.headers },
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Supabase request failed (${response.status}): ${body || response.statusText}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error(`Supabase request timed out after ${REQUEST_TIMEOUT_MS}ms:`, path)
      throw new Error('Request timed out. Please check your connection and try again.')
    }
    console.error('Supabase request error:', path, err)
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchAllPaginated<T>(table: string, select = '*'): Promise<T[]> {
  const results: T[] = []
  let offset = 0

  while (true) {
    const page = await supabaseFetch<T[]>(
      `${table}?select=${select}&limit=${PAGE_SIZE}&offset=${offset}`,
    )
    results.push(...page)
    console.log(`Fetched ${table} page: offset=${offset}, rows=${page.length}, total=${results.length}`)

    if (page.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return results
}

export async function fetchPlayers(): Promise<Player[]> {
  return fetchAllPaginated<Player>('players')
}

export async function fetchReports(): Promise<Report[]> {
  return fetchAllPaginated<Report>('reports')
}

export async function updateReport(
  id: number,
  playerName: string,
  fixtureDate: string,
): Promise<void> {
  await supabaseFetch<void>(`reports?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ player_name: playerName, fixture_date: fixtureDate }),
  })
}

export function getPlayerReports(reports: Report[], playerName: string): Report[] {
  return reports.filter((r) => r.player_name === playerName)
}

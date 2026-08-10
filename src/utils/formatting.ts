import { format, parseISO } from 'date-fns'
import { levelScores, normalizeLevel } from './calculations'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatScoutName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown scout'
}

const scoreValues = Object.values(levelScores)
const MIN_LEVEL_SCORE = Math.min(...scoreValues)
const MAX_LEVEL_SCORE = Math.max(...scoreValues)

// Colors band by relative tier position rather than an exhaustive per-name
// lookup, since the real scale has 13 bands (Upper/Lower sub-tiers, non-league
// steps) rather than the 5 originally documented.
export function getLevelColorClasses(level: string | null): string {
  const normalized = normalizeLevel(level)
  const score = normalized ? levelScores[normalized] : undefined
  if (score === undefined) return 'bg-gray-100 text-muted'

  const fraction = (score - MIN_LEVEL_SCORE) / (MAX_LEVEL_SCORE - MIN_LEVEL_SCORE)
  if (fraction >= 0.75) return 'bg-green-600/10 text-green-700'
  if (fraction >= 0.5) return 'bg-green-400/10 text-green-600'
  if (fraction >= 0.25) return 'bg-warning/10 text-warning'
  return 'bg-danger/10 text-danger'
}

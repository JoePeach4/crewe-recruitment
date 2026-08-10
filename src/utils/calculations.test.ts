import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  convertLevelToScore,
  calculateTimeDecay,
  calculateWeight,
  getWeightedAverageLevel,
  getVerdictBucket,
  getVerdictBreakdown,
  getConsensus,
} from './calculations'
import type { Report } from '../types'

function makeReport(overrides: Partial<Report>): Report {
  return {
    id: 1,
    jotform_submission_id: 'sub',
    player_name: 'Test Player',
    fixture_date: '2026-08-10',
    report_position: 'Centre Midfielder',
    form_id: 'form',
    report_date: '2026-08-10',
    scout_first_name: 'Jane',
    scout_last_name: 'Scout',
    current_playing_level: 'Upper League 1',
    potential_playing_level: 'Championship',
    verdict: 'Sign for first team',
    scout_rating: 1,
    report_weight: 1,
    scout_comments: null,
    ...overrides,
  }
}

describe('convertLevelToScore', () => {
  it('maps known levels to their tier score', () => {
    expect(convertLevelToScore('Premier League')).toBe(13)
    expect(convertLevelToScore('Championship')).toBe(12)
    expect(convertLevelToScore('Below National League')).toBe(1)
  })

  it('normalizes inconsistent source labels to the same tier', () => {
    expect(convertLevelToScore('Step 3')).toBe(convertLevelToScore('Non-League Step 3'))
    expect(convertLevelToScore('National League N/S')).toBe(
      convertLevelToScore('National League North/South'),
    )
  })

  it('returns null for missing or unrecognized levels', () => {
    expect(convertLevelToScore(null)).toBeNull()
    expect(convertLevelToScore('')).toBeNull()
    expect(convertLevelToScore('Not A Real Level')).toBeNull()
  })
})

describe('calculateTimeDecay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns full weight for a fixture today', () => {
    expect(calculateTimeDecay('2026-08-10')).toBeCloseTo(1, 5)
  })

  it('floors at 100/450 for fixtures older than 350 days', () => {
    expect(calculateTimeDecay('2020-01-01')).toBeCloseTo(100 / 450, 5)
  })

  it('returns 0 for missing or invalid dates', () => {
    expect(calculateTimeDecay(null)).toBe(0)
    expect(calculateTimeDecay('not-a-date')).toBe(0)
  })
})

describe('calculateWeight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies full position multiplier on an exact match', () => {
    const weight = calculateWeight(1, '2026-08-10', 'Centre Back', 'Centre Back')
    expect(weight).toBeCloseTo(1, 5)
  })

  it('applies a half position multiplier on a mismatch', () => {
    const weight = calculateWeight(1, '2026-08-10', 'Centre Back', 'Wide Forward')
    expect(weight).toBeCloseTo(0.5, 5)
  })

  it('treats Left/Right Back as matching a report filed as Full Back', () => {
    const weight = calculateWeight(1, '2026-08-10', 'Left Back', 'Full Back')
    expect(weight).toBeCloseTo(1, 5)
  })

  it('defaults scout rating to 1 when missing', () => {
    const weight = calculateWeight(null, '2026-08-10', 'Centre Back', 'Centre Back')
    expect(weight).toBeCloseTo(1, 5)
  })
})

describe('getWeightedAverageLevel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('normalizes an average that falls between two tiers', () => {
    const reports = [
      makeReport({ current_playing_level: 'Upper League 1' }), // score 11
      makeReport({ current_playing_level: 'Championship' }), // score 12
    ]
    const result = getWeightedAverageLevel(reports, 'current_playing_level', 'Centre Midfielder')
    expect(result.level).toBe('Upper League 1')
    expect(result.nextLevel).toBe('Championship')
    expect(result.score).toBe(50)
    expect(result.distance).toBe(50)
  })

  it('caps at the top tier with no next level', () => {
    const reports = [makeReport({ current_playing_level: 'Premier League' })]
    const result = getWeightedAverageLevel(reports, 'current_playing_level', 'Centre Midfielder')
    expect(result.level).toBe('Premier League')
    expect(result.nextLevel).toBeNull()
    expect(result.score).toBe(100)
  })

  it('handles an empty report list gracefully', () => {
    const result = getWeightedAverageLevel([], 'current_playing_level', 'Centre Midfielder')
    expect(result).toEqual({ level: null, score: 0, nextLevel: null, distance: 0 })
  })

  it('skips reports with unrecognized levels', () => {
    const reports = [makeReport({ current_playing_level: '' })]
    const result = getWeightedAverageLevel(reports, 'current_playing_level', 'Centre Midfielder')
    expect(result.level).toBeNull()
  })
})

describe('getVerdictBucket', () => {
  it('buckets free-text verdicts by prefix', () => {
    expect(getVerdictBucket('Sign for first team')).toBe('Sign')
    expect(getVerdictBucket('Sign as squad player')).toBe('Sign')
    expect(getVerdictBucket('Watch again - ASAP')).toBe('Watch')
    expect(getVerdictBucket('Watch again - At some point')).toBe('Watch')
    expect(getVerdictBucket('Forget')).toBe('Forget')
  })

  it('returns null for blank or unrecognized verdicts', () => {
    expect(getVerdictBucket('')).toBeNull()
    expect(getVerdictBucket(null)).toBeNull()
    expect(getVerdictBucket('Maybe later')).toBeNull()
  })
})

describe('getVerdictBreakdown / getConsensus', () => {
  it('counts verdicts into buckets and excludes blanks', () => {
    const reports = [
      makeReport({ verdict: 'Sign for first team' }),
      makeReport({ verdict: 'Sign as squad player' }),
      makeReport({ verdict: 'Watch again - ASAP' }),
      makeReport({ verdict: '' }),
    ]
    const breakdown = getVerdictBreakdown(reports)
    expect(breakdown).toEqual({ sign: 2, watch: 1, forget: 0, total: 3 })
  })

  it('is Positive when Sign outweighs the rest', () => {
    expect(getConsensus({ sign: 5, watch: 1, forget: 0, total: 6 })).toBe('Positive')
  })

  it('is Negative when Forget outweighs the rest', () => {
    expect(getConsensus({ sign: 0, watch: 1, forget: 5, total: 6 })).toBe('Negative')
  })

  it('is Watch Again when Watch strictly leads', () => {
    expect(getConsensus({ sign: 1, watch: 3, forget: 1, total: 5 })).toBe('Watch Again')
  })

  it('is Mixed on a tie', () => {
    expect(getConsensus({ sign: 2, watch: 2, forget: 0, total: 4 })).toBe('Mixed')
  })
})

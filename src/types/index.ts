export type PlayerPosition =
  | 'Goalkeeper'
  | 'Centre Back'
  | 'Left Back'
  | 'Right Back'
  | 'Centre Midfielder'
  | 'Attacking Midfielder'
  | 'Wide Forward'
  | 'Centre Forward'

export type ReportPosition =
  | 'Goalkeeper'
  | 'Centre Back'
  | 'Full Back'
  | 'Centre Midfielder'
  | 'Attacking Midfielder'
  | 'Wide Forward'
  | 'Centre Forward'

export interface Player {
  id: number
  player: string
  club: string | null
  parent_club: string | null
  loan_status: string | null
  position: PlayerPosition | string | null
  contract_status: string | null
  age: number | null
  scout_summary: string | null
  confidence_score: number | null
  live_priority_score: number | null
  sofascore_stats?: Record<string, SofascoreStat> | null
}

export interface SofascoreStat {
  value: number
  zScore: number
  percentile: number
}

export interface Report {
  id: number
  jotform_submission_id: string
  player_name: string
  fixture_date: string | null
  report_position: ReportPosition | string | null
  form_id: string | null
  report_date: string | null
  scout_first_name: string | null
  scout_last_name: string | null
  current_playing_level: string | null
  potential_playing_level: string | null
  verdict: string | null
  scout_rating: number | null
  report_weight: number | null
  team: string | null
  opposition_team: string | null
}

export interface LevelResult {
  level: string | null
  score: number
  nextLevel: string | null
  distance: number
}

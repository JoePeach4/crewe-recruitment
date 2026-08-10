import type { Player, Report } from '../types'

export const mockPlayers: Player[] = [
  {
    id: 1,
    player: 'Test Player',
    club: 'Crewe Alexandra',
    parent_club: null,
    loan_status: null,
    position: 'Centre Midfielder',
    contract_status: 'Contracted',
    age: 21,
    scout_summary: null,
  },
  {
    id: 2,
    player: 'UNASSIGNED',
    club: null,
    parent_club: null,
    loan_status: null,
    position: null,
    contract_status: null,
    age: null,
    scout_summary: null,
  },
]

export const mockReports: Report[] = [
  {
    id: 101,
    jotform_submission_id: 'sub-1',
    player_name: 'Test Player',
    fixture_date: '2026-06-01',
    report_position: 'Centre Midfielder',
    form_id: 'form-1',
    report_date: '2026-06-02',
    scout_first_name: 'Jane',
    scout_last_name: 'Scout',
    current_playing_level: 'Lower League 1',
    potential_playing_level: 'Upper League 1',
    verdict: 'Sign for first team',
    scout_rating: 1,
    report_weight: 0.9,
    scout_comments: 'Strong engine, good on the ball.',
  },
  {
    id: 102,
    jotform_submission_id: 'sub-2',
    player_name: 'Test Player',
    fixture_date: '2026-01-01',
    report_position: 'Wide Forward',
    form_id: 'form-1',
    report_date: '2026-01-02',
    scout_first_name: 'John',
    scout_last_name: 'Watcher',
    current_playing_level: 'Upper League 2',
    potential_playing_level: 'Lower League 1',
    verdict: 'Watch again - ASAP',
    scout_rating: 1,
    report_weight: 0.6,
    scout_comments: null,
  },
]

export const mockSupabasePlayersResponse = mockPlayers
export const mockSupabaseReportsResponse = mockReports

import { useMemo } from 'react'
import type { Report } from '../types'

export function useReportsByPlayer(reports: Report[], playerName: string | null): Report[] {
  return useMemo(() => {
    if (!playerName) return []
    return reports.filter((r) => r.player_name === playerName)
  }, [reports, playerName])
}

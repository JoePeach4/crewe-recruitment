import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPlayers, fetchReports, updateReport as apiUpdateReport } from '../utils/api'
import type { Player, Report } from '../types'

interface UsePlayersResult {
  players: Player[]
  reports: Report[]
  loading: boolean
  error: string | null
  reload: () => void
  updateReport: (id: number, playerName: string, fixtureDate: string) => Promise<void>
}

const UNASSIGNED_PLAYER: Player = {
  id: -1,
  player: 'UNASSIGNED',
  club: null,
  parent_club: null,
  loan_status: null,
  position: null,
  contract_status: null,
  age: null,
  scout_summary: null,
  confidence_score: null,
  live_priority_score: null,
}

export function usePlayers(): UsePlayersResult {
  const [rawPlayers, setPlayers] = useState<Player[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [playersData, reportsData] = await Promise.all([fetchPlayers(), fetchReports()])
        if (cancelled) return
        setPlayers(playersData)
        setReports(reportsData)
        console.log(`Loaded ${playersData.length} players and ${reportsData.length} reports`)
      } catch (err) {
        if (cancelled) return
        console.error('usePlayers load error:', err)
        const detail = err instanceof Error ? err.message : String(err)
        setError(`Failed to load players and reports. ${detail}`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  const updateReport = useCallback(async (id: number, playerName: string, fixtureDate: string) => {
    await apiUpdateReport(id, playerName, fixtureDate)
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, player_name: playerName, fixture_date: fixtureDate } : r)),
    )
  }, [])

  // Some reports arrive with no matching player record — JotForm submissions
  // that couldn't be auto-matched are filed as player_name "UNASSIGNED".
  // Surface a virtual list entry for them so they're visible and editable.
  const players = useMemo(() => {
    const hasUnassignedReports = reports.some((r) => r.player_name?.trim().toUpperCase() === 'UNASSIGNED')
    const hasUnassignedPlayer = rawPlayers.some((p) => p.player.trim().toUpperCase() === 'UNASSIGNED')
    if (hasUnassignedReports && !hasUnassignedPlayer) {
      return [...rawPlayers, UNASSIGNED_PLAYER]
    }
    return rawPlayers
  }, [rawPlayers, reports])

  return { players, reports, loading, error, reload, updateReport }
}

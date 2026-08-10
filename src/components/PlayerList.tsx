import { useEffect, useMemo, useState } from 'react'
import type { Player, Report } from '../types'
import Badge from './ui/Badge'

const POSITIONS = [
  'All',
  'Goalkeeper',
  'Centre Back',
  'Left Back',
  'Right Back',
  'Centre Midfielder',
  'Attacking Midfielder',
  'Wide Forward',
  'Centre Forward',
]

interface PlayerListProps {
  players: Player[]
  reports: Report[]
  loading: boolean
  selectedPlayer: string | null
  onSelectPlayer: (playerName: string) => void
}

export default function PlayerList({
  players,
  reports,
  loading,
  selectedPlayer,
  onSelectPlayer,
}: PlayerListProps) {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [position, setPosition] = useState('All')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const reportCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const report of reports) {
      counts.set(report.player_name, (counts.get(report.player_name) ?? 0) + 1)
    }
    return counts
  }, [reports])

  const filteredPlayers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return players
      .filter((p) => (query ? p.player.toLowerCase().includes(query) : true))
      .filter((p) => (position === 'All' ? true : p.position === position))
      .sort((a, b) => (reportCounts.get(b.player) ?? 0) - (reportCounts.get(a.player) ?? 0))
  }, [players, debouncedSearch, position, reportCounts])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-gray-200">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search players..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <ul className="p-2 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="h-14 rounded-md bg-gray-100 animate-pulse" />
            ))}
          </ul>
        )}

        {!loading && filteredPlayers.length === 0 && (
          <p className="p-4 text-sm text-muted text-center">No players match your search.</p>
        )}

        {!loading && filteredPlayers.length > 0 && (
          <ul>
            {filteredPlayers.map((player) => {
              const isSelected = player.player === selectedPlayer
              return (
                <li key={player.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlayer(player.player)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-primary/5 transition-colors ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-ink truncate">{player.player}</span>
                      <Badge variant="primary">{reportCounts.get(player.player) ?? 0}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {player.position && <Badge variant="neutral">{player.position}</Badge>}
                      {player.club && <span className="text-xs text-muted truncate">{player.club}</span>}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

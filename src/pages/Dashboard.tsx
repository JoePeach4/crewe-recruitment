import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useReportsByPlayer } from '../hooks/useReportsByPlayer'
import Header from '../components/Header'
import PlayerList from '../components/PlayerList'
import PlayerDetail from '../components/PlayerDetail'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

export default function Dashboard() {
  const { players, reports, loading, error, reload, updateReport } = usePlayers()
  const { playerName } = useParams<{ playerName?: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const selectedPlayerName = playerName ? decodeURIComponent(playerName) : null
  const selectedPlayer = players.find((p) => p.player === selectedPlayerName) ?? null
  const selectedPlayerReports = useReportsByPlayer(reports, selectedPlayerName)

  useEffect(() => {
    if (error) showToast(error, 'error')
  }, [error, showToast])

  function handleSelectPlayer(name: string) {
    navigate(`/player/${encodeURIComponent(name)}`)
  }

  return (
    <div className="flex flex-col h-screen">
      <Header playerCount={players.length} reportCount={reports.length} />

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <aside className="w-full md:w-[300px] md:flex-shrink-0 max-h-[45vh] md:max-h-none border-b md:border-b-0 md:border-r border-gray-200 bg-white overflow-hidden">
          <PlayerList
            players={players}
            reports={reports}
            loading={loading}
            selectedPlayer={selectedPlayerName}
            onSelectPlayer={handleSelectPlayer}
          />
        </aside>

        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {selectedPlayer ? (
            <PlayerDetail
              player={selectedPlayer}
              reports={selectedPlayerReports}
              onUpdateReport={updateReport}
            />
          ) : error && !loading && players.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-sm p-8 text-center gap-3">
              <p className="text-danger">{error}</p>
              <Button onClick={reload}>Retry</Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm p-8 text-center">
              {loading ? 'Loading players…' : 'Select a player to view their profile.'}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { Player, Report } from '../types'
import PlayerHeader from './PlayerHeader'
import ReportsTab from './ReportsTab'
import AnalysisTab from './AnalysisTab'
import DataTab from './DataTab'

type TabKey = 'reports' | 'analysis' | 'data'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reports', label: 'Reports' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'data', label: 'Data' },
]

interface PlayerDetailProps {
  player: Player
  reports: Report[]
  onUpdateReport: (id: number, playerName: string, fixtureDate: string) => Promise<void>
}

export default function PlayerDetail({ player, reports, onUpdateReport }: PlayerDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('reports')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PlayerHeader player={player} reports={reports} />

      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'reports' && <ReportsTab reports={reports} onUpdateReport={onUpdateReport} />}
        {activeTab === 'analysis' && <AnalysisTab player={player} reports={reports} />}
        {activeTab === 'data' && <DataTab player={player} />}
      </div>
    </div>
  )
}

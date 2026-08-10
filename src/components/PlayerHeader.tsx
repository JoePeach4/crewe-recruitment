import { useMemo } from 'react'
import type { Player, Report } from '../types'
import { getWeightedAverageLevel, getConfidence } from '../utils/calculations'
import { getLevelColorClasses } from '../utils/formatting'
import Card from './ui/Card'

interface PlayerHeaderProps {
  player: Player
  reports: Report[]
}

function LevelDisplay({ level, score, nextLevel }: { level: string | null; score: number; nextLevel: string | null }) {
  if (!level) {
    return <span className="text-sm text-muted">No data</span>
  }
  return (
    <div className="flex items-center flex-wrap gap-1 text-sm">
      <span className={`px-2 py-0.5 rounded-full font-medium ${getLevelColorClasses(level)}`}>{level}</span>
      <span className="text-ink font-semibold">{score}/100</span>
      {nextLevel && (
        <>
          <span className="text-muted">→</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${getLevelColorClasses(nextLevel)}`}>
            {nextLevel}
          </span>
        </>
      )}
    </div>
  )
}

export default function PlayerHeader({ player, reports }: PlayerHeaderProps) {
  const current = useMemo(
    () => getWeightedAverageLevel(reports, 'current_playing_level', player.position),
    [reports, player.position],
  )
  const potential = useMemo(
    () => getWeightedAverageLevel(reports, 'potential_playing_level', player.position),
    [reports, player.position],
  )
  const confidence = getConfidence(reports.length)

  return (
    <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
      <h1 className="text-2xl md:text-3xl font-bold text-ink">{player.player}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
        <div>
          <div className="text-muted text-xs uppercase tracking-wide">Club</div>
          <div className="font-medium text-ink">{player.club ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted text-xs uppercase tracking-wide">Position</div>
          <div className="font-medium text-ink">{player.position ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted text-xs uppercase tracking-wide">Contract</div>
          <div className="font-medium text-ink">{player.contract_status ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted text-xs uppercase tracking-wide">Age</div>
          <div className="font-medium text-ink">{player.age ?? '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Card className="p-3">
          <div className="text-muted text-xs uppercase tracking-wide">Reports</div>
          <div className="text-xl font-bold text-ink mt-1">{reports.length}</div>
        </Card>
        <Card className="p-3">
          <div className="text-muted text-xs uppercase tracking-wide">Avg Current</div>
          <div className="mt-1">
            <LevelDisplay level={current.level} score={current.score} nextLevel={current.nextLevel} />
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-muted text-xs uppercase tracking-wide">Avg Potential</div>
          <div className="mt-1">
            <LevelDisplay level={potential.level} score={potential.score} nextLevel={potential.nextLevel} />
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-muted text-xs uppercase tracking-wide">Confidence</div>
          <div className="text-xl font-bold text-ink mt-1">{confidence}%</div>
        </Card>
      </div>
    </div>
  )
}

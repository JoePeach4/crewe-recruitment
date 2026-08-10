import type { Player } from '../types'

interface DataTabProps {
  player: Player
}

function barColor(percentile: number): string {
  if (percentile < 33) return 'bg-danger'
  if (percentile < 66) return 'bg-warning'
  return 'bg-success'
}

export default function DataTab({ player }: DataTabProps) {
  const stats = player.sofascore_stats
  const hasStats = stats && Object.keys(stats).length > 0

  if (!hasStats) {
    return (
      <div className="p-6 text-center text-sm text-muted">
        <p>SofaScore data not available for League Two players.</p>
        <p className="mt-1">Data will be populated as it becomes available.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {Object.entries(stats).map(([name, stat]) => (
        <div key={name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-ink capitalize">{name.replace(/_/g, ' ')}</span>
            <span className="text-muted">
              z={stat.zScore.toFixed(2)} · {Math.round(stat.percentile)}th percentile
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 relative overflow-hidden">
            <div
              className={`h-full ${barColor(stat.percentile)}`}
              style={{ width: `${Math.min(100, Math.max(0, stat.percentile))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

import type { Report } from '../types'
import { formatDate, formatScoutName } from '../utils/formatting'
import { getVerdictBucket } from '../utils/calculations'
import Badge from './ui/Badge'

const verdictVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  Sign: 'success',
  Watch: 'warning',
  Forget: 'danger',
}

interface ReportCardProps {
  report: Report
  isUnassigned: boolean
  onEdit: (report: Report) => void
  showPlayerName?: boolean
}

export default function ReportCard({ report, isUnassigned, onEdit, showPlayerName }: ReportCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        isUnassigned ? 'border-danger/40 bg-danger/5' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {showPlayerName && (
            <div className="font-semibold text-sm text-ink">{report.player_name}</div>
          )}
          <div className={showPlayerName ? 'text-xs text-muted mt-0.5' : 'font-semibold text-sm text-ink'}>
            {formatScoutName(report.scout_first_name, report.scout_last_name)}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {formatDate(report.fixture_date)} · {report.report_position ?? '—'}
          </div>
          {(report.team || report.opposition_team) && (
            <div className="text-xs text-muted mt-0.5 capitalize">
              {report.team ?? '—'} vs {report.opposition_team ?? '—'}
            </div>
          )}
        </div>
        {report.verdict && (
          <Badge variant={verdictVariant[getVerdictBucket(report.verdict) ?? ''] ?? 'neutral'}>
            {report.verdict}
          </Badge>
        )}
      </div>

      {isUnassigned && (
        <div className="mt-2 text-xs font-semibold text-danger">[NEEDS PLAYER]</div>
      )}

      <div className="flex flex-wrap gap-4 mt-2 text-sm">
        <div>
          <span className="text-muted">Current: </span>
          <span className="text-ink">{report.current_playing_level ?? '—'}</span>
        </div>
        <div>
          <span className="text-muted">Potential: </span>
          <span className="text-ink">{report.potential_playing_level ?? '—'}</span>
        </div>
        {report.report_weight != null && (
          <div>
            <span className="text-muted">Weight: </span>
            <span className="text-ink">{Math.round(report.report_weight * 100)}%</span>
          </div>
        )}
      </div>

      {isUnassigned && (
        <button
          type="button"
          onClick={() => onEdit(report)}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          ✎ Edit
        </button>
      )}
    </div>
  )
}

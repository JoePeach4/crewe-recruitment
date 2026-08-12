import { useState } from 'react'
import { useReportFeed } from '../hooks/useReportFeed'
import { updateReport } from '../utils/api'
import ReportCard from '../components/ReportCard'
import EditReportDialog from '../components/EditReportDialog'
import type { Report } from '../types'

function isUnassigned(report: Report): boolean {
  return report.player_name?.trim().toUpperCase() === 'UNASSIGNED'
}

export default function ReportFeed() {
  const { reports, loading, error, live } = useReportFeed()
  const [editingReport, setEditingReport] = useState<Report | null>(null)

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-ink">Report Feed</h1>
          <p className="text-xs text-muted">Most recent scout reports, across all players</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${live ? 'bg-success' : 'bg-gray-300'}`} />
          {live ? 'Live' : 'Connecting…'}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <ul className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </ul>
        )}

        {!loading && error && <p className="text-sm text-danger text-center">{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <p className="text-sm text-muted text-center">No reports yet.</p>
        )}

        {!loading && !error && reports.length > 0 && (
          <ul className="space-y-3 max-w-2xl mx-auto">
            {reports.map((report) => (
              <li key={report.id}>
                <ReportCard
                  report={report}
                  isUnassigned={isUnassigned(report)}
                  onEdit={setEditingReport}
                  showPlayerName
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingReport && (
        <EditReportDialog
          report={editingReport}
          onUpdate={updateReport}
          onClose={() => setEditingReport(null)}
        />
      )}
    </div>
  )
}

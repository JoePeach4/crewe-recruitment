import { useMemo, useState } from 'react'
import type { Report } from '../types'
import ReportCard from './ReportCard'
import EditReportDialog from './EditReportDialog'

interface ReportsTabProps {
  reports: Report[]
  onUpdateReport: (id: number, playerName: string, fixtureDate: string) => Promise<void>
}

function isUnassigned(report: Report): boolean {
  return report.player_name?.trim().toUpperCase() === 'UNASSIGNED'
}

export default function ReportsTab({ reports, onUpdateReport }: ReportsTabProps) {
  const [editingReport, setEditingReport] = useState<Report | null>(null)

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const dateA = a.fixture_date ? new Date(a.fixture_date).getTime() : 0
        const dateB = b.fixture_date ? new Date(b.fixture_date).getTime() : 0
        return dateB - dateA
      }),
    [reports],
  )

  if (sortedReports.length === 0) {
    return <p className="p-4 text-sm text-muted text-center">No reports found for this player.</p>
  }

  return (
    <div className="p-4 space-y-3">
      {sortedReports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          isUnassigned={isUnassigned(report)}
          onEdit={setEditingReport}
        />
      ))}

      {editingReport && (
        <EditReportDialog
          report={editingReport}
          onUpdate={onUpdateReport}
          onClose={() => setEditingReport(null)}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import type { Report } from '../types'
import Button from './ui/Button'
import { useToast } from './ui/Toast'

interface EditReportDialogProps {
  report: Report
  onUpdate: (id: number, playerName: string, fixtureDate: string) => Promise<void>
  onClose: () => void
}

export default function EditReportDialog({ report, onUpdate, onClose }: EditReportDialogProps) {
  const [playerName, setPlayerName] = useState(report.player_name)
  const [fixtureDate, setFixtureDate] = useState(report.fixture_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onUpdate(report.id, playerName.trim(), fixtureDate)
      showToast('✓ Updated!', 'success')
      onClose()
    } catch (err) {
      console.error('Failed to update report:', err)
      showToast('Failed to update report', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
        <h3 className="text-lg font-semibold text-ink mb-4">Edit Report</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Fixture Date</label>
            <input
              type="date"
              value={fixtureDate}
              onChange={(e) => setFixtureDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

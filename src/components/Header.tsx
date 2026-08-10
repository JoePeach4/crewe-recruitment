interface HeaderProps {
  playerCount: number
  reportCount: number
}

export default function Header({ playerCount, reportCount }: HeaderProps) {
  function handleSync() {
    window.alert(
      'To sync latest JotForm reports, run in terminal:\n\n' +
        'python3 import_only_missing.py\n\n' +
        'This will fetch new submissions and import only missing reports.\n' +
        'After running, refresh this page!',
    )
  }

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-ink">Recruitment</h1>
        <p className="text-xs text-muted">
          {playerCount.toLocaleString()} players • {reportCount.toLocaleString()} reports
        </p>
      </div>
      <button
        type="button"
        onClick={handleSync}
        className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 whitespace-nowrap"
      >
        🔄 Sync JotForm
      </button>
    </header>
  )
}

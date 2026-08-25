import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportUserDataAsJson } from '../../../lib/exportUserData'
import { showToast } from '../../../lib/toast'
import { useAuth } from '../../../hooks/useAuth'

export function DataExportSection() {
  const { currentUser } = useAuth()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!currentUser) return
    setExporting(true)
    try {
      await exportUserDataAsJson(currentUser.uid)
      showToast('success', 'Your data export has started downloading.')
    } catch {
      showToast('error', 'Could not export your data.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="space-y-3 border-b border-slate-100 py-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Export your data</h2>
        <p className="text-sm text-slate-500">
          Download a copy of your account data as JSON. Project, contact, and note data will be
          included here once those modules launch.
        </p>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download size={15} strokeWidth={1.9} />
        {exporting ? 'Preparing…' : 'Download my data'}
      </button>
    </section>
  )
}

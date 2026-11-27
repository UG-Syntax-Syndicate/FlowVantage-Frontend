import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '../../../components/ui/button'
import { showToast } from '../../../lib/toast'
import type { IntegrationConnection, IntegrationResourceSync } from '../../../types/integrations'
import { useRequestSync } from '../hooks'

const RESOURCE_LABELS: Record<string, string> = {
  messages: 'Mail',
  events: 'Calendar events',
  meetings: 'Meetings',
  files: 'Files',
  contacts: 'Contacts',
  outstandingInvoices: 'Open invoices',
}

function resourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource
}

function describe(resource: IntegrationResourceSync): { tone: 'busy' | 'ok' | 'warn'; text: string } {
  if (resource.lastError) {
    return { tone: 'warn', text: resource.lastError }
  }

  if (resource.phase === 'pending') {
    return { tone: 'busy', text: 'Waiting to start' }
  }

  if (resource.phase === 'backfill') {
    return { tone: 'busy', text: `Importing… ${resource.itemsSynced.toLocaleString()} so far` }
  }

  const when = resource.lastSuccessAt
    ? formatDistanceToNow(new Date(resource.lastSuccessAt), { addSuffix: true })
    : 'just now'
  return { tone: 'ok', text: `Up to date · ${resource.itemsSynced.toLocaleString()} items · checked ${when}` }
}

const TONE_ICON = {
  busy: <Loader2 size={14} strokeWidth={2} className="shrink-0 animate-spin text-accent-600" />,
  ok: <CheckCircle2 size={14} strokeWidth={2} className="shrink-0 text-emerald-600" />,
  warn: <AlertTriangle size={14} strokeWidth={2} className="shrink-0 text-amber-600" />,
}

interface ConnectionSyncStatusProps {
  connection: IntegrationConnection
  /** Starts the provider's sign-in again, for a grant that needs renewing. */
  onReconnect?: () => void
}

/**
 * What the sync is doing with this connection: importing, up to date, or
 * waiting for the user to reconnect. Polled while an import is running (see
 * useConnections), so the count moves without a refresh.
 */
export function ConnectionSyncStatus({ connection, onReconnect }: ConnectionSyncStatusProps) {
  const requestSync = useRequestSync()

  if (!connection.connected || connection.sync.length === 0) return null

  async function handleSyncNow() {
    try {
      await requestSync.mutateAsync(connection.id)
      showToast('success', `${connection.name} sync started`)
    } catch {
      showToast('error', `Could not start a ${connection.name} sync`)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Sync</h3>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/email" className="text-xs font-medium text-accent-600 hover:underline">
            Open mail
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSyncNow}
            disabled={requestSync.isPending || connection.status === 'needs_reauth'}
          >
            <RefreshCw size={13} strokeWidth={2} className={requestSync.isPending ? 'animate-spin' : undefined} />
            Sync now
          </Button>
        </div>
      </div>

      {connection.status === 'needs_reauth' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>
            {connection.name} stopped syncing because its access was revoked or expired.
          </span>
          {onReconnect && (
            <Button type="button" size="sm" onClick={onReconnect}>
              Reconnect
            </Button>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {connection.sync.map((resource) => {
          const { tone, text } = describe(resource)
          return (
            <li key={resource.resource} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">{TONE_ICON[tone]}</span>
              <span className="min-w-0">
                <span className="font-medium text-slate-800">{resourceLabel(resource.resource)}</span>
                <span className="text-slate-500"> — {text}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

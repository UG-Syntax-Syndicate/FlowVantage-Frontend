import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { IntegrationIcon } from '../../../components/dashboard/account/IntegrationIcon'
import {
  INTEGRATION_ORDER,
  INTEGRATION_PRESENTATION,
} from '../../../components/dashboard/account/integrationCatalogue'
import { useConnections, useGoogleCalendarStatus, useWhatsAppPreferences } from '../../../hooks/useIntegrationsData'
import { Skeleton } from '../../../components/ui/skeleton'

/**
 * Account settings → Integrations: the index.
 *
 * Every tile is a link to that integration's own page, where connecting is a
 * single button. Nothing is configured inline any more - the previous version
 * put WhatsApp's whole verification flow on this page, which made the one
 * integration with real settings look different from all the others.
 *
 * Connection state comes from the server, never from a hand-maintained list
 * here, so a tile cannot claim something that is not true.
 */
function StateBadge({ connected, configured }: { connected: boolean; configured: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        <Check size={11} strokeWidth={2.5} />
        Connected
      </span>
    )
  }
  if (!configured) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
        Unavailable on this server
      </span>
    )
  }
  return (
    <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-medium text-accent-700">Not connected</span>
  )
}

export function IntegrationsTab() {
  const { data: connections = [], isLoading } = useConnections()
  const { data: googleStatus } = useGoogleCalendarStatus()
  const { data: whatsAppPreferences } = useWhatsAppPreferences()

  // WhatsApp and Google Calendar keep their own modules, so their state comes
  // from their own endpoints rather than the connections catalogue.
  const stateById = new Map(connections.map((connection) => [connection.id, connection]))

  function stateFor(id: string): { connected: boolean; configured: boolean; accountLabel: string | null } {
    if (id === 'google_calendar') {
      return {
        connected: Boolean(googleStatus?.connected),
        configured: Boolean(googleStatus?.configured),
        accountLabel: null,
      }
    }
    if (id === 'whatsapp') {
      return {
        connected: Boolean(whatsAppPreferences?.verified && whatsAppPreferences?.enabled),
        configured: whatsAppPreferences?.whatsappConfigured ?? true,
        accountLabel: whatsAppPreferences?.phone ?? null,
      }
    }
    const connection = stateById.get(id)
    return {
      connected: Boolean(connection?.connected),
      configured: Boolean(connection?.configured),
      accountLabel: connection?.accountLabel ?? null,
    }
  }

  const connectedCount = INTEGRATION_ORDER.filter((id) => stateFor(id).connected).length

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Integrations</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Connect the tools you already use. Choose one to set it up —{' '}
          {isLoading ? 'checking what is connected…' : `${connectedCount} connected.`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[104px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTEGRATION_ORDER.map((id) => {
            const presentation = INTEGRATION_PRESENTATION[id]
            if (!presentation) return null
            const state = stateFor(id)

            return (
              <Link
                key={id}
                to={`/dashboard/account/integrations/${id}`}
                className="group flex items-start gap-3 rounded-2xl border border-line bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/60"
              >
                <IntegrationIcon name={presentation.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {INTEGRATION_LABELS[id] ?? id}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{presentation.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <StateBadge connected={state.connected} configured={state.configured} />
                    {state.connected && state.accountLabel && (
                      <span className="truncate text-[11px] text-slate-400">{state.accountLabel}</span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-slate-500"
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Display names. The connections endpoint carries these for the providers it
 * owns, but WhatsApp and Google Calendar are not in it, and a tile should not
 * wait on a request to know what to call itself.
 */
const INTEGRATION_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  google_calendar: 'Google Calendar',
  gmail: 'Gmail',
  outlook: 'Outlook',
  slack: 'Slack',
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  zoom: 'Zoom',
  yuki: 'Yuki',
  perfectview: 'PerfectView',
}

import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plug } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { EmptyState } from '../../../components/common/EmptyState'
import { Alert } from '../../../components/common/Alert'
import { IntegrationIcon } from '../../../components/dashboard/account/IntegrationIcon'
import { ConnectPanel } from '../../../components/dashboard/account/ConnectPanel'
import { WhatsAppSection } from '../../../components/dashboard/account/WhatsAppSection'
import { GoogleCalendarSection } from '../../../components/dashboard/account/GoogleCalendarSection'
import { INTEGRATION_PRESENTATION } from '../../../components/dashboard/account/integrationCatalogue'
import { useConnection } from '../../../hooks/useIntegrationsData'
import { showToast } from '../../../lib/toast'

const CALLBACK_MESSAGES: Record<string, { variant: 'success' | 'error'; message: string }> = {
  connected: { variant: 'success', message: 'Connected.' },
  denied: { variant: 'error', message: 'Not connected — the permission request was declined.' },
  error: { variant: 'error', message: 'Something went wrong connecting. Please try again.' },
}

const LABELS: Record<string, string> = {
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

/**
 * One integration's own page, reached by clicking its tile.
 *
 * WhatsApp and Google Calendar render their existing sections, because each
 * has settings beyond "connected or not". Everything else renders the generic
 * connect panel driven by the backend's provider registry.
 */
export function IntegrationDetailPage() {
  const { provider = '' } = useParams<{ provider: string }>()
  const presentation = INTEGRATION_PRESENTATION[provider]
  const isSelfManaged = provider === 'whatsapp' || provider === 'google_calendar'

  // Only the generic providers have a connections row to fetch.
  const { data: connection, isLoading } = useConnection(isSelfManaged ? '' : provider)

  const [searchParams, setSearchParams] = useSearchParams()
  const callbackStatus = searchParams.get('connection')

  useEffect(() => {
    if (!callbackStatus) return
    const result = CALLBACK_MESSAGES[callbackStatus]
    if (result) showToast(result.variant, result.message)
    // Drop the param so a refresh does not replay the toast.
    const next = new URLSearchParams(searchParams)
    next.delete('connection')
    setSearchParams(next, { replace: true })
  }, [callbackStatus, searchParams, setSearchParams])

  if (!presentation) {
    return (
      <EmptyState
        icon={Plug}
        title="No such integration"
        description="This integration does not exist, or is no longer offered."
      />
    )
  }

  const name = LABELS[provider] ?? provider

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/dashboard/account/integrations"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        All integrations
      </Link>

      <div className="flex items-start gap-3.5">
        <IntegrationIcon name={presentation.icon} className="h-12 w-12" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{presentation.detail}</p>
        </div>
      </div>

      <Card>
        <CardContent>
          {provider === 'whatsapp' ? (
            <WhatsAppSection />
          ) : provider === 'google_calendar' ? (
            <GoogleCalendarSection />
          ) : isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-9 w-44" />
            </div>
          ) : connection ? (
            <ConnectPanel connection={connection} icon={presentation.icon} />
          ) : (
            <p className="text-sm text-slate-500">This integration could not be loaded. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {/* Said after the connect control, not instead of it: connecting really
          does store the authorisation, and the feature it powers is what is
          still to come. Claiming otherwise in either direction would mislead. */}
      {presentation.comingSoon && !isSelfManaged && (
        <Alert variant="info">{presentation.comingSoon}</Alert>
      )}
    </div>
  )
}

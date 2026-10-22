import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { WhatsAppSection } from '../../../components/dashboard/account/WhatsAppSection'
import { GoogleCalendarSection } from '../../../components/dashboard/account/GoogleCalendarSection'
import { IntegrationIcon } from '../../../components/dashboard/account/IntegrationIcon'
import {
  INTEGRATION_CATALOGUE,
  type IntegrationDefinition,
} from '../../../components/dashboard/account/integrationCatalogue'
import { useGoogleCalendarStatus, useWhatsAppPreferences } from '../../../hooks/useIntegrationsData'

/**
 * Account settings → Integrations.
 *
 * Two halves. The configurable ones (WhatsApp, Google Calendar) get a full
 * section each, because they have real backends and real settings. Everything
 * else is a catalogue card that says plainly that it is not connectable yet and
 * what it needs — the alternative, a Connect button that does nothing, is worse
 * than an honest "not yet".
 *
 * Per-project configuration deliberately does not live here: linking a WhatsApp
 * group to a project is project configuration, not a user preference, so it
 * sits on the project itself. This page is only the things that belong to *you*.
 */

function PlannedCard({ integration }: { integration: IntegrationDefinition }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <IntegrationIcon name={integration.icon} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">{integration.name}</h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {integration.category}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{integration.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          Not connected yet
        </span>
        {integration.note && (
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700"
          >
            What it needs
            <ChevronDown size={12} strokeWidth={2} className={open ? 'rotate-180 transition' : 'transition'} />
          </button>
        )}
      </div>

      {open && integration.note && (
        <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">{integration.note}</p>
      )}
    </div>
  )
}

function ConnectedSummaryCard({
  integration,
  connected,
}: {
  integration: IntegrationDefinition
  connected: boolean
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
      <IntegrationIcon name={integration.icon} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{integration.name}</h3>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {integration.category}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{integration.description}</p>
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {connected && <Check size={11} strokeWidth={2.5} />}
          {connected ? 'Connected' : 'Available — set up below'}
        </span>
      </div>
    </div>
  )
}

export function IntegrationsTab() {
  const { data: googleStatus } = useGoogleCalendarStatus()
  const { data: whatsAppPreferences } = useWhatsAppPreferences()

  const whatsAppConnected = Boolean(whatsAppPreferences?.verified && whatsAppPreferences?.enabled)

  const available = INTEGRATION_CATALOGUE.filter((item) => item.status === 'available')
  const planned = INTEGRATION_CATALOGUE.filter((item) => item.status === 'planned')

  const connectedById: Record<string, boolean> = {
    whatsapp: whatsAppConnected,
    'google-calendar': Boolean(googleStatus?.connected),
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Your integrations</h2>
          <p className="mt-0.5 text-sm text-slate-500">Connected tools and the ones you can set up right now.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {available.map((integration) => (
            <ConnectedSummaryCard
              key={integration.id}
              integration={integration}
              connected={connectedById[integration.id] ?? false}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardContent>
          <GoogleCalendarSection />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <WhatsAppSection />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Available to build</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            These have been checked against each vendor's API. None is wired up yet — expand a card to see what it
            would take.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {planned.map((integration) => (
            <PlannedCard key={integration.id} integration={integration} />
          ))}
        </div>
      </section>
    </div>
  )
}

import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { IntegrationResourceSupport } from '../../../types/integrations'

/**
 * What a connected integration can read and write.
 *
 * Driven by the backend's adapter registry rather than a list kept here, so it
 * cannot claim an operation the server has no code for. The labels turn
 * resource names into something a non-technical reader recognises; an unlisted
 * resource falls back to its own name rather than being hidden, so a newly
 * added one shows up without a frontend change.
 */
const RESOURCE_LABELS: Record<string, { read: string; write: string }> = {
  messages: { read: 'Read recent messages', write: 'Send messages' },
  channels: { read: 'List channels', write: 'Create channels' },
  files: { read: 'List files', write: 'Upload files' },
  meetings: { read: 'List upcoming meetings', write: 'Create meetings' },
  contacts: { read: 'Read contacts', write: 'Create and update contacts' },
  administrations: { read: 'List administrations', write: 'Create administrations' },
  glAccounts: { read: 'Read the chart of accounts', write: 'Write ledger accounts' },
  salesInvoices: { read: 'Read sales invoices', write: 'Push sales invoices' },
}

interface ConnectionCapabilitiesProps {
  resources: Record<string, IntegrationResourceSupport>
}

export function ConnectionCapabilities({ resources }: ConnectionCapabilitiesProps) {
  const entries = Object.entries(resources)
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-sm font-semibold text-slate-900">What this connection allows</h3>
      <ul className="flex flex-col gap-1.5">
        {entries.flatMap(([resource, support]) => {
          const labels = RESOURCE_LABELS[resource]
          const rows = []
          if (support.get) {
            rows.push(
              <li key={`${resource}-get`} className="flex items-center gap-2 text-sm text-slate-600">
                <ArrowDownToLine size={14} strokeWidth={2} className="shrink-0 text-slate-400" />
                {labels?.read ?? `Read ${resource}`}
              </li>,
            )
          }
          if (support.post) {
            rows.push(
              <li key={`${resource}-post`} className="flex items-center gap-2 text-sm text-slate-600">
                <ArrowUpFromLine size={14} strokeWidth={2} className="shrink-0 text-slate-400" />
                {labels?.write ?? `Write ${resource}`}
              </li>,
            )
          }
          return rows
        })}
      </ul>
    </div>
  )
}

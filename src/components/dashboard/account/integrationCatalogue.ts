import type { IntegrationIconName } from './IntegrationIcon'

/**
 * The integrations catalogue.
 *
 * `status` is the honest state of each one, not a wish:
 *  - 'available'  the backend implements it end to end and the card can act.
 *  - 'planned'    researched, and the auth model is known, but no backend yet.
 *
 * A planned card never offers a Connect button, because there is nothing behind
 * it. `note` says what it would take, so the page documents the backlog instead
 * of implying the feature already works.
 */
export type IntegrationStatus = 'available' | 'planned'

export interface IntegrationDefinition {
  id: string
  name: string
  icon: IntegrationIconName
  category: 'Messaging' | 'Email' | 'Calendar' | 'Files' | 'Finance' | 'CRM'
  description: string
  status: IntegrationStatus
  /** For planned entries: how it would authenticate, from the vendor's own docs. */
  note?: string
}

export const INTEGRATION_CATALOGUE: IntegrationDefinition[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'whatsapp',
    category: 'Messaging',
    description: 'Send task and project notifications to your phone, and link a group per project.',
    status: 'available',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: 'google-calendar',
    category: 'Calendar',
    description: 'Two-way sync: events created here appear in Google, and changes there sync back.',
    status: 'available',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'gmail',
    category: 'Email',
    description: 'Connect a mailbox so project email is sent and received for real, not saved as a local draft.',
    status: 'planned',
    note: 'Needs a Gmail API OAuth flow (gmail.send + gmail.readonly) and token storage, like the Google Calendar link already has.',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: 'outlook',
    category: 'Email',
    description: 'The same mailbox connection for Microsoft 365 and Outlook.com accounts.',
    status: 'planned',
    note: 'Needs Microsoft Graph OAuth (Mail.Send + Mail.Read). Calendar sync could ride on the same token.',
  },
  {
    id: 'yuki',
    name: 'Yuki',
    icon: 'yuki',
    category: 'Finance',
    description: 'Push invoices and journal entries to Yuki bookkeeping, and read back GL accounts.',
    status: 'planned',
    note: 'Integrable: Yuki exposes SOAP webservices at api.yukiworks.nl/ws (Sales.asmx, Accounting.asmx, AccountingInfo.asmx), authenticated with a per-administration API key from Settings → API keys. No OAuth, so this needs an encrypted key field rather than a Connect redirect.',
  },
  {
    id: 'perfectview',
    name: 'PerfectView',
    icon: 'perfectview',
    category: 'CRM',
    description: 'Sync contacts and companies with PerfectView CRM Online.',
    status: 'planned',
    note: 'Integrable: PerfectView CRM Online has a REST API authenticated with an API key plus Database ID and User ID, from Settings → Connectors → API. Also needs an encrypted-credentials form rather than OAuth.',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    category: 'Messaging',
    description: 'Post project activity into a Slack channel, alongside the WhatsApp notifications.',
    status: 'planned',
    note: 'Needs a Slack app with an incoming-webhook or chat:write scope; the notification outbox that already drives WhatsApp could fan out to it.',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: 'google-drive',
    category: 'Files',
    description: 'Attach files straight from Drive instead of re-uploading them.',
    status: 'planned',
    note: 'Needs Drive API OAuth (drive.file). Documents currently upload to Cloudinary.',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'dropbox',
    category: 'Files',
    description: 'The same file picker for teams that keep documents in Dropbox.',
    status: 'planned',
    note: 'Needs Dropbox OAuth and the chooser SDK.',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    icon: 'zoom',
    category: 'Calendar',
    description: 'Generate a meeting link when you schedule a calendar event.',
    status: 'planned',
    note: 'Needs Zoom OAuth (meeting:write) — this is what the event sheet’s "Join meeting" button is waiting on.',
  },
]

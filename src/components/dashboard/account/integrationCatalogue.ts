import type { IntegrationIconName } from './IntegrationIcon'

/**
 * Presentation for each integration: its icon and the words describing it.
 *
 * Connection *state* is never stored here - that comes from the backend
 * (`GET /integrations/connections`), because only the server knows whether it
 * holds the vendor credentials and whether this user has signed in. Keeping a
 * hand-maintained "status" here was how the page previously claimed things
 * that were not true.
 *
 * Keys match the backend's provider ids exactly, so the two cannot drift.
 */
export interface IntegrationPresentation {
  id: string
  icon: IntegrationIconName
  /** One line on the card. */
  summary: string
  /** What connecting actually gets you, on the detail page. */
  detail: string
  /** Shown while a provider has no backend feature behind it yet. */
  comingSoon?: string
}

/**
 * The two integrations that predate the generic connection framework and keep
 * their own modules: WhatsApp has its own preferences and verification flow,
 * and Google Calendar its own sync tokens and event mapping. They are
 * presented identically to the rest, but their pages render their own
 * sections rather than the generic connect panel.
 */
export const SELF_MANAGED_PROVIDERS = ['whatsapp', 'google_calendar'] as const

export const INTEGRATION_PRESENTATION: Record<string, IntegrationPresentation> = {
  whatsapp: {
    id: 'whatsapp',
    icon: 'whatsapp',
    summary: 'Get task and project notifications on your phone.',
    detail:
      'Verify a phone number once, then choose which project events are worth a message. A project can also be linked to a group chat.',
  },
  google_calendar: {
    id: 'google_calendar',
    icon: 'google-calendar',
    summary: 'Two-way sync between FlowVantage events and Google Calendar.',
    detail:
      'Events you create here are pushed to Google, and changes made in Google are pulled back when you sync. Your existing Google events show up on the FlowVantage calendar.',
  },
  gmail: {
    id: 'gmail',
    icon: 'gmail',
    summary: 'Send and receive project email from your Gmail account.',
    detail:
      'Connecting lets FlowVantage send mail as you and read replies, so a message composed here actually leaves your mailbox instead of being saved as a draft.',
    comingSoon:
      'Connecting stores the authorisation now. Sending through it arrives with the mailbox work - the composer still saves to Drafts until then.',
  },
  outlook: {
    id: 'outlook',
    icon: 'outlook',
    summary: 'The same mailbox connection for Microsoft 365 and Outlook.com.',
    detail:
      'Connecting lets FlowVantage send mail as you and read replies, through Microsoft Graph, for Microsoft 365 and Outlook.com accounts alike.',
    comingSoon:
      'Connecting stores the authorisation now. Sending through it arrives with the mailbox work - the composer still saves to Drafts until then.',
  },
  slack: {
    id: 'slack',
    icon: 'slack',
    summary: 'Post project activity into a Slack channel.',
    detail:
      'The same notifications WhatsApp can deliver, posted into a channel instead - useful when the team already lives in Slack.',
    comingSoon: 'Connecting stores the authorisation now. Choosing a channel to post into arrives with the Slack delivery work.',
  },
  google_drive: {
    id: 'google_drive',
    icon: 'google-drive',
    summary: 'Attach files straight from Drive instead of re-uploading them.',
    detail:
      'Pick a file from your Drive when attaching to a project, rather than downloading it and uploading it again.',
    comingSoon: 'Connecting stores the authorisation now. The file picker arrives with the Drive attachment work.',
  },
  dropbox: {
    id: 'dropbox',
    icon: 'dropbox',
    summary: 'The same file picker for teams that keep documents in Dropbox.',
    detail: 'Pick a file from Dropbox when attaching to a project, rather than downloading and re-uploading it.',
    comingSoon: 'Connecting stores the authorisation now. The file picker arrives with the Dropbox attachment work.',
  },
  zoom: {
    id: 'zoom',
    icon: 'zoom',
    summary: 'Generate a meeting link when you schedule an event.',
    detail:
      'Scheduling a calendar event can create the Zoom meeting at the same time, so the join link is on the event from the start.',
    comingSoon: 'Connecting stores the authorisation now. Generating links on events arrives with the Zoom meeting work.',
  },
  yuki: {
    id: 'yuki',
    icon: 'yuki',
    summary: 'Push invoices and journal entries to Yuki bookkeeping.',
    detail:
      'Yuki has no sign-in flow for third-party apps, so this is connected with an API key from your Yuki administration instead. The key is encrypted before it is stored.',
    comingSoon: 'Your credentials are stored now. Pushing invoices and reading GL accounts arrives with the bookkeeping work.',
  },
  perfectview: {
    id: 'perfectview',
    icon: 'perfectview',
    summary: 'Sync contacts and companies with PerfectView CRM Online.',
    detail:
      'PerfectView authenticates with an API key rather than a sign-in, so it is connected with credentials from your PerfectView account. They are encrypted before they are stored.',
    comingSoon: 'Your credentials are stored now. Syncing contacts both ways arrives with the CRM work.',
  },
}

/** Display order on the index page: the ones that do something today, first. */
export const INTEGRATION_ORDER = [
  'google_calendar',
  'whatsapp',
  'gmail',
  'outlook',
  'slack',
  'google_drive',
  'dropbox',
  'zoom',
  'yuki',
  'perfectview',
]

/**
 * Types for /api/v1/integrations.
 *
 * WhatsApp is the only provider with a live backend today. The catalogue types
 * below describe every provider the Integrations screen lists, so an entry that
 * is not connectable yet is still a real, described thing rather than a button
 * that pretends.
 */

/** Every project event that can produce a WhatsApp notification. Mirrors EVENTS in notifications.service.js. */
export type WhatsAppEvent =
  | 'project.status_changed'
  | 'task.assigned'
  | 'task.completed'
  | 'task.due_soon'
  | 'document.added'
  | 'message.posted'
  | 'inventory.low_stock'

export const WHATSAPP_EVENT_LABELS: Record<WhatsAppEvent, { label: string; description: string }> = {
  'project.status_changed': {
    label: 'Project status changes',
    description: 'When a project moves to planning, in progress, on hold or completed.',
  },
  'task.assigned': { label: 'Task assigned to me', description: 'When someone puts a task on your plate.' },
  'task.completed': { label: 'Task completed', description: 'When a task on your projects is marked done.' },
  'task.due_soon': { label: 'Task due soon', description: 'A nudge before a deadline, rather than after it.' },
  'document.added': { label: 'Document added', description: 'When a file is uploaded to one of your projects.' },
  'message.posted': { label: 'New project message', description: 'When someone posts in a project thread.' },
  'inventory.low_stock': {
    label: 'Stock running low',
    description: 'When an item reaches its reorder threshold.',
  },
}

export interface WhatsAppPreferences {
  /** The verified number, in E.164. Null until one is confirmed. */
  phone: string | null
  verified: boolean
  enabled: boolean
  events: WhatsAppEvent[]
  /** Every event the server knows about, so the UI cannot drift from it. */
  availableEvents: WhatsAppEvent[]
  /**
   * False when the deployment has no WhatsApp credentials. The UI explains that
   * rather than offering controls that would queue messages nothing can send.
   */
  whatsappConfigured: boolean
  /**
   * False until the Official Business Account approval lands. Group posting
   * caps a group at 8 participants and has no add-participant endpoint, so it
   * stays behind a flag.
   */
  groupMessagingAvailable: boolean
}

export interface WhatsAppVerificationStarted {
  expiresAt: string
  /** Returned outside production only, so a developer without a live number can finish the flow. */
  code?: string
}

export interface ProjectWhatsAppGroup {
  projectId: string
  groupId: string
  inviteLink: string | null
  updatedAt: string
}

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

/** One row of a project's delivery log - what was sent, to whom, and why it failed. */
export interface NotificationLogEntry {
  id: string
  channel: string
  recipient: string
  template: string | null
  status: NotificationStatus
  attempts: number
  lastError: string | null
  createdAt: string
  sentAt: string | null
  summary: string | null
}

// ---------------------------------------------------------------------------
// Third-party connections
// ---------------------------------------------------------------------------

/** How a provider is connected: a vendor sign-in, or credentials the user pastes. */
export type IntegrationKind = 'oauth' | 'api_key'

/** One field an api_key provider needs, as the backend's provider registry describes it. */
export interface IntegrationCredentialField {
  name: string
  label: string
  /** Rendered as a password field and never echoed back from the server. */
  secret: boolean
  help?: string
}

/** Which verbs a provider's resource supports, as its adapter reports them. */
export interface IntegrationResourceSupport {
  get: boolean
  post: boolean
}

export interface IntegrationConnection {
  id: string
  name: string
  kind: IntegrationKind
  category: string
  /**
   * Whether this *server* can complete a connection at all — i.e. whether the
   * vendor credentials are present in its environment. False means the Connect
   * button would 503, so the UI explains instead of offering it.
   */
  configured: boolean
  /** Whether this *user* has connected it. */
  connected: boolean
  accountLabel: string | null
  connectedAt: string | null
  credentialFields: IntegrationCredentialField[] | null
  /**
   * What this provider can read and write once connected, keyed by resource
   * name (`messages`, `files`, `contacts`…). Comes from the backend's adapter
   * registry so the UI never keeps a second copy of it.
   */
  resources: Record<string, IntegrationResourceSupport> | null
}

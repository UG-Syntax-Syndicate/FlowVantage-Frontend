import { getJson, patchJson, postJsonAuthed, putJson } from '../lib/backendApi'
import { readBackendSessionToken } from '../lib/backendSession'
import type {
  IntegrationConnection,
  NotificationLogEntry,
  NotificationStatus,
  ProjectWhatsAppGroup,
  WhatsAppEvent,
  WhatsAppPreferences,
  WhatsAppVerificationStarted,
} from '../types/integrations'

/** Client for /api/v1/integrations. */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) {
    throw new Error('Not signed in')
  }
  return token
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

// ---------------------------------------------------------------------------
// WhatsApp: per-user notification settings
// ---------------------------------------------------------------------------

export async function fetchWhatsAppPreferences(): Promise<WhatsAppPreferences> {
  const { data } = await getJson<ApiEnvelope<WhatsAppPreferences>>(
    '/integrations/whatsapp/preferences',
    authToken(),
  )
  return data
}

/**
 * Sends a six-digit code over WhatsApp.
 *
 * Nothing is ever sent to an unverified number - a typo would otherwise
 * deliver a project's activity to a stranger indefinitely - and sending the
 * code over WhatsApp itself also proves the number can receive messages.
 */
export async function startWhatsAppVerification(phone: string): Promise<WhatsAppVerificationStarted> {
  const { data } = await postJsonAuthed<ApiEnvelope<WhatsAppVerificationStarted>>(
    '/integrations/whatsapp/verify',
    { phone },
    authToken(),
  )
  return data
}

export async function confirmWhatsAppVerification(code: string): Promise<{ verified: boolean; enabled: boolean }> {
  const { data } = await postJsonAuthed<ApiEnvelope<{ verified: boolean; enabled: boolean }>>(
    '/integrations/whatsapp/verify/confirm',
    { code },
    authToken(),
  )
  return data
}

export async function updateWhatsAppPreferences(updates: {
  enabled?: boolean
  events?: WhatsAppEvent[]
}): Promise<WhatsAppPreferences> {
  const { data } = await patchJson<ApiEnvelope<WhatsAppPreferences>>(
    '/integrations/whatsapp/preferences',
    updates,
    authToken(),
  )
  return data
}

// ---------------------------------------------------------------------------
// WhatsApp: per-project group
// ---------------------------------------------------------------------------

interface GroupRow {
  project_id: string
  group_id: string
  invite_link: string | null
  updated_at: string
}

function mapGroup(row: GroupRow | null): ProjectWhatsAppGroup | null {
  if (!row) return null
  return {
    projectId: row.project_id,
    groupId: row.group_id,
    inviteLink: row.invite_link,
    updatedAt: row.updated_at,
  }
}

export async function fetchProjectWhatsAppGroup(projectId: string): Promise<ProjectWhatsAppGroup | null> {
  const { data } = await getJson<ApiEnvelope<GroupRow | null>>(
    `/integrations/projects/${projectId}/whatsapp-group`,
    authToken(),
  )
  return mapGroup(data)
}

/**
 * Links a group to a project.
 *
 * Allowed even while group messaging is switched off, so the configuration can
 * be prepared ahead of Official Business Account approval. The response carries
 * a `warning` in that case; the caller surfaces it rather than implying
 * messages will start flowing.
 */
export async function linkProjectWhatsAppGroup(
  projectId: string,
  input: { groupId: string; inviteLink?: string },
): Promise<{ group: ProjectWhatsAppGroup | null; warning?: string }> {
  const payload = await postJsonAuthed<ApiEnvelope<GroupRow> & { warning?: string }>(
    `/integrations/projects/${projectId}/whatsapp-group`,
    { groupId: input.groupId, inviteLink: input.inviteLink || null },
    authToken(),
  )
  return { group: mapGroup(payload.data), warning: payload.warning }
}

// ---------------------------------------------------------------------------
// Delivery log
// ---------------------------------------------------------------------------

interface OutboxRow {
  id: string
  channel: string
  recipient: string
  template: string | null
  status: NotificationStatus
  attempts: number
  last_error: string | null
  created_at: string
  sent_at: string | null
  payload: string
}

/**
 * The delivery log for a project - what was sent, when, and why it failed.
 *
 * `payload` is stored as a JSON string and carries the human-readable summary
 * the message was built from. Parsed defensively: a log row that cannot be
 * parsed should still appear with its status, since the status is the part
 * someone is here to read.
 */
function mapLogEntry(row: OutboxRow): NotificationLogEntry {
  let summary: string | null = null
  try {
    const parsed = JSON.parse(row.payload) as { summary?: string }
    summary = typeof parsed.summary === 'string' ? parsed.summary : null
  } catch {
    summary = null
  }

  return {
    id: row.id,
    channel: row.channel,
    recipient: row.recipient,
    template: row.template,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    summary,
  }
}

export async function fetchProjectNotifications(projectId: string, limit = 50): Promise<NotificationLogEntry[]> {
  const { data } = await getJson<ApiEnvelope<OutboxRow[]>>(
    `/integrations/projects/${projectId}/notifications?limit=${limit}`,
    authToken(),
  )
  return data.map(mapLogEntry)
}

// ---------------------------------------------------------------------------
// Google Calendar: OAuth link/unlink and a manual pull.
//
// These live under /calendar rather than /integrations because the backend
// groups them with the calendar module, but they are integration settings as
// far as the user is concerned, so the client for them belongs here.
// ---------------------------------------------------------------------------

export interface GoogleCalendarStatus {
  /** Whether this user has linked a Google account. */
  connected: boolean
  /**
   * Whether the server has Google OAuth credentials at all. False means
   * connecting is impossible on this deployment, so the UI explains instead of
   * offering a Connect button that would 503 - the same contract
   * `whatsappConfigured` already provides for WhatsApp.
   */
  configured: boolean
}

export async function fetchGoogleCalendarStatus(): Promise<GoogleCalendarStatus> {
  const { connected, configured } = await getJson<{
    success: boolean
    connected: boolean
    configured: boolean
  }>('/calendar/google/status', authToken())
  return { connected, configured }
}

/**
 * Returns the Google consent URL to send the browser to. The backend carries
 * the user id in the OAuth `state` and redirects back to
 * /dashboard/account/integrations?googleCalendar=<status> when it is done.
 */
export async function fetchGoogleCalendarAuthUrl(): Promise<string> {
  const { url } = await getJson<{ success: boolean; url: string }>('/calendar/google/connect', authToken())
  return url
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await postJsonAuthed('/calendar/google/disconnect', {}, authToken())
}

/** Pulls changes made in Google since the last sync. Returns how many events were applied. */
export async function syncGoogleCalendar(): Promise<{ applied: number; fullResync: boolean }> {
  const result = await postJsonAuthed<{ success: boolean; applied: number; fullResync: boolean }>(
    '/calendar/sync',
    {},
    authToken(),
  )
  return { applied: result.applied, fullResync: result.fullResync }
}

// ---------------------------------------------------------------------------
// Third-party connections (OAuth sign-in, or stored credentials)
// ---------------------------------------------------------------------------

export async function fetchConnections(): Promise<IntegrationConnection[]> {
  const { data } = await getJson<ApiEnvelope<IntegrationConnection[]>>('/integrations/connections', authToken())
  return data
}

export async function fetchConnection(provider: string): Promise<IntegrationConnection> {
  const { data } = await getJson<ApiEnvelope<IntegrationConnection>>(
    `/integrations/connections/${provider}`,
    authToken(),
  )
  return data
}

/**
 * Asks the backend for the vendor's consent URL. The backend returns it rather
 * than redirecting, so an unconfigured provider comes back as a readable 503
 * instead of a dead-end redirect.
 */
export async function startConnection(provider: string): Promise<string> {
  const { url } = await postJsonAuthed<{ success: boolean; url: string }>(
    `/integrations/connections/${provider}/connect`,
    {},
    authToken(),
  )
  return url
}

export async function saveConnectionCredentials(
  provider: string,
  credentials: Record<string, string>,
): Promise<IntegrationConnection> {
  const { data } = await putJson<ApiEnvelope<IntegrationConnection>>(
    `/integrations/connections/${provider}/credentials`,
    credentials,
    authToken(),
  )
  return data
}

export async function disconnectConnection(provider: string): Promise<IntegrationConnection> {
  const { data } = await postJsonAuthed<ApiEnvelope<IntegrationConnection>>(
    `/integrations/connections/${provider}/disconnect`,
    {},
    authToken(),
  )
  return data
}

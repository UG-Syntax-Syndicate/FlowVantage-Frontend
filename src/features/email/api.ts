import { getJson, patchJson, postJsonAuthed } from '../../lib/backendApi'
import type { ComposeEmailInput, Email, EmailFolder } from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

interface EmailRow {
  id: string
  project_id: string | null
  folder: EmailFolder
  sender_name: string | null
  sender_email: string
  sender_color: string | null
  subject: string | null
  body: string | null
  sent_at: string
  starred: boolean
  read: boolean
}

function excerptFromEmailBody(body: string): string {
  return body.length > 120 ? `${body.slice(0, 120).trimEnd()}…` : body
}

function mapEmail(row: EmailRow): Email {
  const body = row.body || ''
  return {
    id: row.id,
    projectId: row.project_id,
    folder: row.folder,
    senderName: row.sender_name || row.sender_email,
    senderColor: row.sender_color || '#94a3b8',
    subject: row.subject || '',
    snippet: excerptFromEmailBody(body),
    body,
    receivedAt: row.sent_at,
    starred: row.starred,
    read: row.read,
  }
}

export async function fetchEmails(): Promise<Email[]> {
  const { data } = await getJson<ApiEnvelope<EmailRow[]>>('/emails', authToken())
  return data.map(mapEmail)
}

export async function toggleEmailStar(emailId: string): Promise<void> {
  const token = authToken()
  const { data: current } = await getJson<ApiEnvelope<EmailRow>>(`/emails/${emailId}`, token)
  await patchJson(`/emails/${emailId}`, { starred: !current.starred }, token)
  emitProjectsChanged()
}

export async function markEmailsRead(emailIds: string[]): Promise<void> {
  const token = authToken()
  await Promise.all(emailIds.map((id) => patchJson(`/emails/${id}`, { read: true }, token)))
  emitProjectsChanged()
}

export async function moveEmailsToFolder(emailIds: string[], folder: EmailFolder): Promise<void> {
  const token = authToken()
  await Promise.all(emailIds.map((id) => patchJson(`/emails/${id}`, { folder }, token)))
  emitProjectsChanged()
}

export async function composeEmail(input: ComposeEmailInput): Promise<Email> {
  const { data } = await postJsonAuthed<ApiEnvelope<EmailRow>>(
    '/emails',
    { to: input.to, subject: input.subject, snippet: input.snippet },
    authToken(),
  )
  emitProjectsChanged()
  return mapEmail(data)
}

/** Which mailbox a send would leave from, so the composer can say so first. */
export interface EmailSender {
  via: 'gmail' | 'outlook' | 'smtp' | null
  name: string | null
  address: string | null
  canSend: boolean
}

export async function fetchEmailSender(): Promise<EmailSender> {
  const { data } = await getJson<ApiEnvelope<EmailSender>>('/emails/sender', authToken())
  return data
}

/**
 * Sends for real, unlike composeEmail above, which files a draft. Separate
 * because one of them can fail at a third party and the other cannot.
 */
export async function sendEmail(input: ComposeEmailInput & { contactId?: string | null; projectId?: string | null }): Promise<Email> {
  const { data } = await postJsonAuthed<ApiEnvelope<EmailRow>>(
    '/emails/send',
    {
      to: input.to,
      subject: input.subject,
      body: input.snippet,
      contactId: input.contactId ?? null,
      projectId: input.projectId ?? null,
    },
    authToken(),
  )
  emitProjectsChanged()
  return mapEmail(data)
}

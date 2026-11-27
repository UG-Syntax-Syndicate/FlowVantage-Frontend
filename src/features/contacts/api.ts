import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
  postJsonAuthedWithTimeout,
} from '../../lib/backendApi'
import { pickAvatar } from '../../lib/avatars'
import type {
  BulkImportContactsResult,
  BulkImportSkippedRow,
  Contact,
  ContactInput,
} from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken, type ApiEnvelope } from '../../lib/authedRequest'

interface ContactRow {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  role: string | null
  niche: string | null
  notes: string | null
  status: Contact['status']
  stage: Contact['stage']
  workspace_id: string
  visibility: Contact['visibility']
  project_id: string | null
  created_at: string
}

function mapContact(row: ContactRow): Contact {
  const contactName = [row.first_name, row.last_name].filter(Boolean).join(' ')
  return {
    id: row.id,
    company: row.company || '',
    contactName,
    role: row.role || '',
    email: row.email || '',
    phone: row.phone || '',
    photoURL: pickAvatar(row.email || row.id),
    status: row.status,
    niche: row.niche || '',
    notes: row.notes || '',
    stage: row.stage,
    workspaceId: row.workspace_id,
    visibility: row.visibility || 'private',
    projectId: row.project_id,
    createdAt: row.created_at,
  }
}

function contactInputBody(input: ContactInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    role: input.role,
    niche: input.niche,
    notes: input.notes,
    workspace_id: input.workspaceId,
    visibility: input.visibility,
    project_id: input.projectId,
    allow_duplicate: input.allowDuplicate,
  }
}

export async function fetchContacts(workspaceId?: string): Promise<Contact[]> {
  const path = workspaceId ? `/contacts?workspace_id=${encodeURIComponent(workspaceId)}` : '/contacts'
  const { data } = await getJson<ApiEnvelope<ContactRow[]>>(path, authToken())
  return data.map(mapContact)
}

export async function createContact(input: ContactInput): Promise<Contact> {
  const { data } = await postJsonAuthed<ApiEnvelope<ContactRow>>('/contacts', contactInputBody(input), authToken())
  emitProjectsChanged()
  return mapContact(data)
}

export async function updateContact(contactId: string, input: ContactInput): Promise<Contact> {
  const { data } = await patchJson<ApiEnvelope<ContactRow>>(
    `/contacts/${contactId}`,
    contactInputBody(input),
    authToken(),
  )
  emitProjectsChanged()
  return mapContact(data)
}

export async function deleteContact(contactId: string): Promise<void> {
  await deleteJson(`/contacts/${contactId}`, authToken())
  emitProjectsChanged()
}

export interface BulkDeleteContactsResult {
  deleted: number
  /** Ids that were not the caller's to delete, or had already gone. */
  skipped: number
}

/**
 * Deletes several contacts in one request.
 *
 * One call rather than N: deleting fifty contacts one at a time means fifty
 * round trips, fifty audit entries and a partially-applied result if the tab
 * is closed halfway. The server checks ownership per id and reports how many
 * it actually removed.
 */
export async function bulkDeleteContacts(contactIds: string[]): Promise<BulkDeleteContactsResult> {
  const { data } = await postJsonAuthed<ApiEnvelope<BulkDeleteContactsResult>>(
    '/contacts/bulk-delete',
    { ids: contactIds },
    authToken(),
  )
  emitProjectsChanged()
  return data
}

interface BulkImportSkippedRowPayload {
  input: Record<string, unknown>
  existingContact?: ContactRow
  message?: string
}

/**
 * Maps a skipped row back to the camelCase shape the UI works in. The server
 * echoes the snake_case body it received, so this is the inverse of
 * contactInputBody.
 */
function mapSkippedRow(row: BulkImportSkippedRowPayload): BulkImportSkippedRow {
  const input = row.input ?? {}
  return {
    contact: {
      firstName: String(input.firstName ?? ''),
      lastName: (input.lastName as string | undefined) ?? undefined,
      email: (input.email as string | undefined) ?? undefined,
      phone: (input.phone as string | undefined) ?? undefined,
      company: (input.company as string | undefined) ?? undefined,
      role: (input.role as string | undefined) ?? undefined,
      niche: (input.niche as string | undefined) ?? undefined,
      notes: (input.notes as string | undefined) ?? undefined,
      visibility: input.visibility as ContactInput['visibility'],
      projectId: (input.projectId as string | null | undefined) ?? undefined,
    },
    existingContact: row.existingContact ? mapContact(row.existingContact) : undefined,
    message: row.message,
  }
}

export async function bulkImportContacts(
  workspaceId: string | undefined,
  contacts: ContactInput[],
  allowDuplicates = false,
): Promise<BulkImportContactsResult> {
  // The backend inserts rows sequentially (several DB round trips each), so
  // the default 5s request timeout routinely aborts a real batch before the
  // backend finishes - the contacts still get created, but the frontend
  // never sees the response and shows a false "Import failed". Scale the
  // timeout with batch size instead.
  const importTimeoutMs = Math.min(60000, 15000 + contacts.length * 400)
  const { data } = await postJsonAuthedWithTimeout<ApiEnvelope<{
    created: ContactRow[]
    createdCount: number
    duplicateCount: number
    failedCount: number
    duplicates?: BulkImportSkippedRowPayload[]
    failed?: BulkImportSkippedRowPayload[]
  }>>(
    '/contacts/bulk-import',
    {
      workspace_id: workspaceId,
      contacts: contacts.map(contactInputBody),
      allow_duplicates: allowDuplicates || undefined,
    },
    authToken(),
    importTimeoutMs,
  )
  emitProjectsChanged()
  return {
    created: data.created.map(mapContact),
    createdCount: data.createdCount,
    duplicateCount: data.duplicateCount,
    failedCount: data.failedCount,
    duplicates: (data.duplicates ?? []).map(mapSkippedRow),
    failed: (data.failed ?? []).map(mapSkippedRow),
  }
}

// Raised from 25. At 25 a 2,000-contact import was 80 separate requests, which
// both ate into the API's rate-limit budget and made the import needlessly slow
// through round-trip latency alone. 100 still keeps each request well inside
// its scaled timeout and the 1mb body limit, while cutting the request count
// fourfold.
const IMPORT_CHUNK_SIZE = 100

/**
 * Splits a large import into fixed-size chunks and sends them sequentially,
 * reporting real progress after each one completes. This is what makes the
 * import progress ring genuine rather than simulated, and independently
 * hardens the timeout fix above further - no single request ever has to
 * carry more than IMPORT_CHUNK_SIZE rows, so it stays fast regardless of
 * how large the overall import is.
 */
export async function bulkImportContactsChunked(
  workspaceId: string | undefined,
  contacts: ContactInput[],
  onProgress?: (done: number, total: number) => void,
  allowDuplicates = false,
): Promise<BulkImportContactsResult> {
  const total = contacts.length
  const aggregate: BulkImportContactsResult = {
    created: [],
    createdCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    duplicates: [],
    failed: [],
  }

  for (let i = 0; i < contacts.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = contacts.slice(i, i + IMPORT_CHUNK_SIZE)

    // Each chunk is isolated. An unhandled throw here used to abandon the whole
    // import and discard the aggregate - while every chunk already sent had
    // been committed server-side. The user saw a flat "Import failed", and
    // retrying the same file then reported all the committed rows as
    // duplicates, which looked exactly like the import silently refusing to
    // work. Recording the chunk as failed instead keeps the run going and
    // reports honestly at the end.
    try {
      const result = await bulkImportContacts(workspaceId, chunk, allowDuplicates)
      aggregate.created.push(...result.created)
      aggregate.createdCount += result.createdCount
      aggregate.duplicateCount += result.duplicateCount
      aggregate.failedCount += result.failedCount
      aggregate.duplicates.push(...result.duplicates)
      aggregate.failed.push(...result.failed)
    } catch (error) {
      aggregate.failedCount += chunk.length
      aggregate.failed.push(
        ...chunk.map((contact) => ({
          contact,
          message: error instanceof Error ? error.message : 'Could not import this batch',
        })),
      )
    }

    onProgress?.(Math.min(i + chunk.length, total), total)
  }

  return aggregate
}

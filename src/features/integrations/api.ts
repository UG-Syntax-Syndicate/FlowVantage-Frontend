import { getJson, postJsonAuthed, putJson } from '../../lib/backendApi'
import { readBackendSessionToken } from '../../lib/backendSession'
import type { components } from '../../types/api.gen'
import type { FileItemsRequest, InboxFilters, InboxPage } from './types'

type Schemas = components['schemas']

/** Client for the synced-data side of /api/v1/integrations. */

function authToken(): string {
  const token = readBackendSessionToken()
  if (!token) throw new Error('Not signed in')
  return token
}

export async function fetchInbox(filters: InboxFilters, cursor?: string): Promise<InboxPage> {
  const params = new URLSearchParams({ kind: filters.kind, filed: filters.filed, limit: '50' })
  if (filters.provider) params.set('provider', filters.provider)
  if (filters.projectId) params.set('projectId', filters.projectId)
  if (cursor) params.set('cursor', cursor)

  const response = await getJson<Schemas['InboxResponse']>(`/integrations/inbox?${params}`, authToken())

  return { items: response.data, nextCursor: response.nextCursor, unfiled: response.unfiled }
}

/** Files items into a project; projectId null returns them to the inbox. */
export async function fileItems(
  items: FileItemsRequest['items'],
  projectId: FileItemsRequest['projectId'],
): Promise<{ filed: number }> {
  const { data } = await postJsonAuthed<Schemas['FileItemsResponse']>(
    '/integrations/items/file',
    { items, projectId } satisfies FileItemsRequest,
    authToken(),
  )
  return data
}

/** Queues an immediate sync; progress shows on the connection's status. */
export async function requestSync(provider: string): Promise<{ queued: string[] }> {
  const { data } = await postJsonAuthed<{ data: { queued: string[] } }>(
    `/integrations/connections/${provider}/sync`,
    {},
    authToken(),
  )
  return data
}

export async function setConnectionWorkspace(provider: string, workspaceId: string | null): Promise<void> {
  await putJson(`/integrations/connections/${provider}/workspace`, { workspaceId }, authToken())
}

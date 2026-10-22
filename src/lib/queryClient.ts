import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { reportError } from './observability'

/**
 * A failed session is expected and already handled a layer down, where the
 * request re-authenticates and replays itself (see backendApi.request). Only a
 * failure that survives that is worth reporting, so the recovered ones don't
 * drown out real faults.
 */
function isExpectedFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /not signed in|session expired|missing session token/i.test(message)
}

/**
 * Every query and mutation failure funnels through here. There was previously no
 * global hook at all, so a failing query surfaced as a stale or empty screen and
 * nothing recorded that it had failed - which is how a workspace list that could
 * not load ended up looking identical to a user who simply had no workspaces.
 */
const queryCache = new QueryCache({
  onError: (error, query) => {
    if (isExpectedFailure(error)) return
    reportError(error, { source: 'react-query.query', queryKey: query.queryKey })
  },
})

const mutationCache = new MutationCache({
  onError: (error, _variables, _context, mutation) => {
    if (isExpectedFailure(error)) return
    reportError(error, { source: 'react-query.mutation', mutationKey: mutation.options.mutationKey })
  },
})

export const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // The actual sync mechanism for folders/todos/notes/contacts/documents
      // (no realtime push for those - see useRealtimeSync.ts) and a cheap
      // resilience net for projects/tasks too, covering any missed-event or
      // SSE-reconnect gap.
      refetchOnWindowFocus: true,
    },
  },
})

/**
 * Convention: a *list* key is the base key plus the active workspace id
 * (`[...queryKeys.projects, workspaceId]`), so switching workspace selects a
 * different cache entry instead of reusing the previous workspace's rows.
 * Invalidation still uses the bare base key, which React Query prefix-matches.
 *
 * Note `project(id)` produces the same *shape* as a scoped list key,
 * `['projects', <string>]`. It currently has no callers; if you add one, give it
 * a distinguishing segment (e.g. `['projects', 'detail', id]`) rather than
 * relying on project and workspace ids never colliding.
 */
export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  tasks: ['tasks'] as const,
  members: ['members'] as const,
  folders: ['folders'] as const,
  todos: ['todos'] as const,
  notes: ['notes'] as const,
  meetings: ['meetings'] as const,
  emails: ['emails'] as const,
  documents: ['documents'] as const,
  contacts: ['contacts'] as const,
  chatMessages: ['chatMessages'] as const,
  inventory: ['inventory'] as const,
  inventoryLocations: ['inventoryLocations'] as const,
  inventorySuppliers: ['inventorySuppliers'] as const,
  inventoryValuation: ['inventoryValuation'] as const,
  inventoryLowStock: ['inventoryLowStock'] as const,
  // Project-scoped, so these take the id as a segment rather than the active
  // workspace - the project itself pins the workspace.
  itemMovements: (itemId: string) => ['inventory', 'movements', itemId] as const,
  projectAllocations: (projectId: string) => ['inventory', 'allocations', projectId] as const,
  projectConsumption: (projectId: string) => ['inventory', 'consumption', projectId] as const,
  reportData: (projectId: string) => ['reportData', projectId] as const,
  taskComments: (taskId: string) => ['taskComments', taskId] as const,
  projectMessages: (projectId: string) => ['projectMessages', projectId] as const,
  unreadMessages: ['unreadMessages'] as const,
  whatsappPreferences: ['whatsappPreferences'] as const,
  googleCalendarStatus: ['googleCalendarStatus'] as const,
  integrationConnections: ['integrationConnections'] as const,
  integrationConnection: (provider: string) => ['integrationConnections', provider] as const,
  projectWhatsappGroup: (projectId: string) => ['projectWhatsappGroup', projectId] as const,
  projectNotifications: (projectId: string) => ['projectNotifications', projectId] as const,
  workspaces: ['workspaces'] as const,
  workspaceMembers: (workspaceId: string) => ['workspaces', workspaceId, 'members'] as const,
  pendingInvites: (workspaceId: string) => ['workspaces', workspaceId, 'invites'] as const,
  projectMembers: (projectId: string) => ['projects', projectId, 'members'] as const,
}

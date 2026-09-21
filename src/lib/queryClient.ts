import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
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
}

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
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

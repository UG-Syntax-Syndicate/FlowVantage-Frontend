import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as aiApi from '../../api/aiApi'
import { useWorkspace } from '../../hooks/useWorkspace'

export function useChatMessages() {
  return useQuery({ queryKey: queryKeys.chatMessages, queryFn: aiApi.fetchChatMessages })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  return useMutation({
    mutationFn: ({ content, provider }: { content: string; provider: aiApi.AiProvider }) => {
      if (!activeWorkspaceId) {
        throw new Error('No active workspace')
      }
      return aiApi.sendChatMessage(content, { provider, workspaceId: activeWorkspaceId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages })
    },
  })
}

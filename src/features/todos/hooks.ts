import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as todosApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import type { CreateTodoInput, UpdateTodoInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useTodos() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.todos, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => todosApi.fetchTodos(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useToggleTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (todoId: string) => todosApi.toggleTodo(todoId),
    onMutate: async (todoId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos })
      const previousTodos = queryClient.getQueryData(queryKeys.todos)
      queryClient.setQueryData(queryKeys.todos, (old: Awaited<ReturnType<typeof todosApi.fetchTodos>> = []) =>
        old.map((todo) => (todo.id === todoId ? { ...todo, done: !todo.done } : todo)),
      )
      return { previousTodos }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKeys.todos, context.previousTodos)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todosApi.createTodo(input),
    onSuccess: (todo) => {
      recordAudit('create', 'todo', todo.id, { projectId: todo.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

/**
 * Edits a todo's title/tags/due date. The done flag has its own optimistic
 * toggle above - this is the form path.
 */
export function useUpdateTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ todoId, input }: { todoId: string; input: UpdateTodoInput }) =>
      todosApi.updateTodo(todoId, input),
    onSuccess: (_todo, { todoId, input }) => {
      recordAudit('update', 'todo', todoId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (todoId: string) => todosApi.deleteTodo(todoId),
    onSuccess: (_data, todoId) => {
      recordAudit('delete', 'todo', todoId)
      queryClient.invalidateQueries({ queryKey: queryKeys.todos })
    },
  })
}

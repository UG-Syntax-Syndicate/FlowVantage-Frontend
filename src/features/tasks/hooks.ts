import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as tasksApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import { celebrate } from '../../lib/celebrate'
import { showToast } from '../../lib/toast'
import { useMarkMilestone } from '../../hooks/useOnboarding'
import type { CreateTaskInput, TaskStatus, UpdateTaskInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useTasks() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.tasks, activeWorkspaceId],
    // An arrow function, not a bare reference: React Query calls queryFn with a
    // QueryFunctionContext, which would otherwise arrive as the workspaceId
    // argument and serialise into ?workspace_id=[object Object].
    queryFn: () => tasksApi.fetchTasks(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  const markMilestone = useMarkMilestone()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateTaskStatus(taskId, status),
    onSuccess: (_data, { taskId, status }) => {
      recordAudit('update', 'task', taskId, { status })

      // The first completed task is worth celebrating, and this is the only
      // place in the app where a task becomes done. New tasks are always
      // created as 'todo', so '-> done' is the transition that counts.
      //
      // The server decides whether this was genuinely the first: it answers
      // atomically, so two tabs completing tasks at the same moment produce one
      // celebration rather than two. There is no per-user task counter and
      // `tasks` has no completed_at, so this signal has to be derived here -
      // but the once-only guarantee does not.
      if (status !== 'done') return

      markMilestone.mutate('firstTaskCompletedAt', {
        onSuccess: ({ wasFirst }) => {
          if (!wasFirst) return

          const animated = celebrate()
          showToast(
            'success',
            'First task complete! 🎉',
            animated ? undefined : 'Nice work - that is the hard part over with.',
          )
        },
        // Deliberately silent on failure. A celebration that could not be
        // recorded must not turn a successful task update into an error toast.
        onError: () => {},
      })
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks })
      const previousTasks = queryClient.getQueryData(queryKeys.tasks)
      queryClient.setQueryData(queryKeys.tasks, (old: Awaited<ReturnType<typeof tasksApi.fetchTasks>> = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status } : task)),
      )
      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks, context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateTaskInput }) =>
      tasksApi.createTask({ ...input, projectId, status: 'todo' }),
    onSuccess: (task) => {
      recordAudit('create', 'task', task.id, { projectId: task.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

/**
 * Full task edit. The status-only shortcut above stays optimistic because it
 * fires from a drag or a checkbox; this one runs behind a form, so it waits.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      tasksApi.updateTask(taskId, input),
    onSuccess: (_task, { taskId, input }) => {
      recordAudit('update', 'task', taskId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.deleteTask(taskId),
    onSuccess: (_data, taskId) => {
      recordAudit('delete', 'task', taskId)
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks })
      // Comments hang off the task and go with it.
      queryClient.removeQueries({ queryKey: queryKeys.taskComments(taskId) })
    },
  })
}

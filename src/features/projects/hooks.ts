import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as projectsApi from './api'
import { useAuth } from '../../hooks/useAuth'
import { useWorkspace } from '../../hooks/useWorkspace'
import { useWorkspaceMembers } from '../../hooks/useWorkspacesData'
import type {
  CreateProjectInput,
  Member,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

/**
 * Projects in the active workspace.
 *
 * The workspace id is part of the query key, not just the request: without it
 * React Query served one cache entry for every workspace, so switching
 * workspace left the previous workspace's projects on screen until something
 * else happened to invalidate them. `useContacts` (features/contacts) was already keyed this
 * way - projects, tasks, folders, notes, todos and documents were not, which is
 * the whole of bug C.
 */
export function useProjects() {
  const { backendSessionToken } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  return useQuery({
    queryKey: [...queryKeys.projects, activeWorkspaceId],
    queryFn: () => projectsApi.fetchProjects(activeWorkspaceId ?? undefined),
    enabled: Boolean(backendSessionToken) && Boolean(activeWorkspaceId),
  })
}

/**
 * Everyone in the active workspace, as the lightweight `Member` shape the
 * task/calendar/report views use to resolve an assignee id into a name and a
 * face.
 *
 * This used to be the signed-in user and nobody else - first as a second
 * GET /auth/me, then derived from the profile - which meant every task
 * assigned to a colleague rendered with no avatar and no name anywhere in the
 * app. GET /workspaces/:id/members is the list that actually answers "who
 * could this be assigned to", and it is already fetched and cached for the
 * members screen, so this usually costs nothing.
 *
 * The caller's own profile is folded in as a fallback: the list is empty
 * until it loads, and a personal workspace still has to resolve to the one
 * person in it.
 */
export function useMembers() {
  const { backendSessionToken, userProfile } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const { data: workspaceMembers, isLoading } = useWorkspaceMembers(activeWorkspaceId ?? undefined)

  const data = useMemo<Member[]>(() => {
    if (!backendSessionToken) return []

    const members = (workspaceMembers ?? []).map((member) => ({
      id: member.userId,
      name: member.name || member.email,
      photoURL: member.photoURL,
    }))

    if (userProfile && !members.some((member) => member.id === userProfile.id)) {
      members.unshift({
        id: userProfile.id,
        name: userProfile.name || userProfile.email,
        photoURL: userProfile.photoURL,
      })
    }

    return members
  }, [backendSessionToken, userProfile, workspaceMembers])

  return { data, isLoading: Boolean(backendSessionToken) && isLoading && !userProfile }
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      projectsApi.updateProjectStatus(projectId, status),
    onSuccess: (_data, { projectId, status }) => {
      recordAudit('update', 'project', projectId, { status })
    },
    onMutate: async ({ projectId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects })
      const previousProjects = queryClient.getQueryData(queryKeys.projects)
      queryClient.setQueryData(
        queryKeys.projects,
        (old: Awaited<ReturnType<typeof projectsApi.fetchProjects>> = []) =>
          old.map((project) => (project.id === projectId ? { ...project, status } : project)),
      )
      return { previousProjects }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

export function useUpdateProjectImage() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, image }: { projectId: string; image: string | null }) =>
      projectsApi.updateProjectImage(projectId, image),
    onSuccess: (_data, { projectId }) => {
      recordAudit('update', 'project', projectId, { field: 'image' })
    },
    onMutate: async ({ projectId, image }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects })
      const previousProjects = queryClient.getQueryData(queryKeys.projects)
      queryClient.setQueryData(
        queryKeys.projects,
        (old: Awaited<ReturnType<typeof projectsApi.fetchProjects>> = []) =>
          old.map((project) => (project.id === projectId ? { ...project, image } : project)),
      )
      return { previousProjects }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

/**
 * General project edit, for the fields the status/image shortcuts above don't
 * cover. Not optimistic: an edit form stays open until the server answers, so
 * there is no stale frame to paper over.
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      projectsApi.updateProject(projectId, input),
    onSuccess: (project, { projectId, input }) => {
      recordAudit('update', 'project', projectId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
      queryClient.invalidateQueries({ queryKey: queryKeys.project(project.id) })
    },
  })
}

/**
 * Deleting a project cascades on the server to its tasks, todos, notes and
 * documents, so every one of those caches has to be dropped too - otherwise the
 * dashboard keeps counting work that no longer exists.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.deleteProject(projectId),
    onSuccess: (_data, projectId) => {
      recordAudit('delete', 'project', projectId)
      for (const key of [
        queryKeys.projects,
        queryKeys.tasks,
        queryKeys.todos,
        queryKeys.notes,
        queryKeys.documents,
        queryKeys.folders,
        queryKeys.meetings,
      ]) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      const existingColors = (queryClient.getQueryData<Project[]>(queryKeys.projects) ?? []).map((p) => p.color)
      return projectsApi.createProject(input, existingColors)
    },
    onSuccess: (project) => {
      recordAudit('create', 'project', project.id, { name: project.name })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects })
    },
  })
}

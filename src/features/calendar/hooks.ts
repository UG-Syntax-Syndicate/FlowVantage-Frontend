import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryClient'
import * as calendarApi from './api'
import { useAuth } from '../../hooks/useAuth'
import type { MeetingInput } from '../../types/project'
import { useAuditRecorder } from '../../hooks/useAuditRecorder'

export function useMeetings() {
  const { backendSessionToken } = useAuth()
  return useQuery({
    queryKey: queryKeys.meetings,
    queryFn: calendarApi.fetchMeetings,
    enabled: Boolean(backendSessionToken),
  })
}

export function useCreateMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (input: MeetingInput) => calendarApi.createMeeting(input),
    onSuccess: (meeting) => {
      recordAudit('create', 'meeting', meeting.id, { projectId: meeting.projectId })
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: ({ meetingId, input }: { meetingId: string; input: MeetingInput }) =>
      calendarApi.updateMeeting(meetingId, input),
    onSuccess: (_meeting, { meetingId, input }) => {
      recordAudit('update', 'meeting', meetingId, { fields: Object.keys(input) })
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  const recordAudit = useAuditRecorder()
  return useMutation({
    mutationFn: (meetingId: string) => calendarApi.deleteMeeting(meetingId),
    onSuccess: (_data, meetingId) => {
      recordAudit('delete', 'meeting', meetingId)
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings })
    },
  })
}

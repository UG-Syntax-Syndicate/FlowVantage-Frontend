import {
  getJson,
  patchJson,
  deleteJson,
  postJsonAuthed,
} from '../../lib/backendApi'
import type { Meeting, MeetingInput } from '../../types/project'
import { emitProjectsChanged } from '../../api/mockRealtimeBus'
import { authToken } from '../../lib/authedRequest'

/**
 * Calendar events, from the backend's Google-Calendar-backed /calendar API,
 * mapped into the lighter Meeting shape the dashboard reminder card and mini
 * calendar use.
 */

interface CalendarEventRow {
  id: string
  title: string
  location: string | null
  projectId: string | null
  startTime: string
  endTime: string
  joinUrl: string | null
  source: string | null
}

function mapMeeting(row: CalendarEventRow): Meeting {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    location: row.location,
    startTime: row.startTime,
    endTime: row.endTime,
    joinUrl: row.joinUrl ?? null,
    source: row.source ?? null,
  }
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { events } = await getJson<{ success: boolean; events: CalendarEventRow[] }>('/calendar', authToken())
  return events.map(mapMeeting)
}

/**
 * Calendar events are the one module whose responses are not wrapped in the
 * { success, data } envelope - they return { success, event } (and the push to
 * Google is best-effort, reported back as `syncedToGoogle`, which the UI does
 * not currently surface).
 */
interface CalendarEventEnvelope {
  success: boolean
  event: CalendarEventRow
  syncedToGoogle: boolean
}

/** The wire body for both create and update - the backend PATCH replaces rather than merges. */
function meetingBody(input: MeetingInput) {
  return {
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location ?? undefined,
    description: input.description ?? undefined,
    projectId: input.projectId ?? null,
    joinUrl: input.joinUrl ?? null,
  }
}

export async function createMeeting(input: MeetingInput): Promise<Meeting> {
  const { event } = await postJsonAuthed<CalendarEventEnvelope>('/calendar', meetingBody(input), authToken())
  emitProjectsChanged()
  return mapMeeting(event)
}

export async function updateMeeting(meetingId: string, input: MeetingInput): Promise<Meeting> {
  const { event } = await patchJson<CalendarEventEnvelope>(`/calendar/${meetingId}`, meetingBody(input), authToken())
  emitProjectsChanged()
  return mapMeeting(event)
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  await deleteJson(`/calendar/${meetingId}`, authToken())
  emitProjectsChanged()
}

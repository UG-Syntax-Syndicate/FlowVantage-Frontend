import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MeetingInputSchema, type Meeting, type MeetingInput } from '../../types/project'
import { useCreateMeeting, useProjects, useUpdateMeeting } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { showToast } from '../../lib/toast'

/** Splits an ISO string into the `yyyy-mm-dd` and `hh:mm` the date/time inputs want, in local time. */
function splitLocal(iso: string): { date: string; time: string } {
  const value = new Date(iso)
  const pad = (part: number) => String(part).padStart(2, '0')
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  }
}

function combine(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00`).toISOString()
}

/** The next whole hour, as a sensible default start for a new event. */
function nextHour(): Date {
  const value = new Date()
  value.setMinutes(0, 0, 0)
  value.setHours(value.getHours() + 1)
  return value
}

interface MeetingFormModalProps {
  /** Omit to create an event; pass one to edit it in place. */
  meeting?: Meeting
  /** Pre-selects the project for a new event, e.g. when opened from a project. */
  defaultProjectId?: string | null
  onClose: () => void
}

/**
 * Create/edit form for a calendar event. If the user has linked Google
 * Calendar the backend pushes the change there too, best-effort - a failed
 * push still saves the event locally, so this form does not report on it.
 */
export function MeetingFormModal({ meeting, defaultProjectId, onClose }: MeetingFormModalProps) {
  const createMeeting = useCreateMeeting()
  const updateMeeting = useUpdateMeeting()
  const { data: projects = [] } = useProjects()
  const isEditing = Boolean(meeting)
  const isPending = createMeeting.isPending || updateMeeting.isPending

  const defaultStart = meeting ? meeting.startTime : nextHour().toISOString()
  const defaultEnd = meeting
    ? meeting.endTime
    : new Date(nextHour().getTime() + 60 * 60_000).toISOString()

  const startParts = splitLocal(defaultStart)
  const endParts = splitLocal(defaultEnd)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MeetingInput>({
    resolver: zodResolver(MeetingInputSchema),
    defaultValues: {
      title: meeting?.title ?? '',
      startTime: defaultStart,
      endTime: defaultEnd,
      location: meeting?.location ?? '',
      description: '',
      projectId: meeting?.projectId ?? defaultProjectId ?? null,
    },
  })

  const [startDate, setStartDate] = useState(startParts.date)
  const [startTime, setStartTime] = useState(startParts.time)
  const [endDate, setEndDate] = useState(endParts.date)
  const [endTime, setEndTime] = useState(endParts.time)

  const selectedProjectId = watch('projectId')

  /**
   * The four date/time inputs are the source of truth for the two ISO form
   * fields, so each change recomputes its own field immediately rather than
   * through an effect - that keeps validation (end >= start) honest on submit.
   */
  function setStart(date: string, time: string) {
    setStartDate(date)
    setStartTime(time)
    if (date) setValue('startTime', combine(date, time), { shouldDirty: true, shouldValidate: true })
  }

  function setEnd(date: string, time: string) {
    setEndDate(date)
    setEndTime(time)
    if (date) setValue('endTime', combine(date, time), { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = handleSubmit(async (values) => {
    // The backend treats an empty string and null the same way, but null is
    // the honest "not set" for an optional column.
    const input: MeetingInput = {
      ...values,
      location: values.location?.trim() ? values.location.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
    }
    try {
      if (meeting) {
        await updateMeeting.mutateAsync({ meetingId: meeting.id, input })
        showToast('success', 'Event updated')
      } else {
        await createMeeting.mutateAsync(input)
        showToast('success', 'Event added')
      }
      onClose()
    } catch {
      showToast('error', meeting ? 'Could not save this event' : 'Could not add this event')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit event' : 'New event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input {...register('title')} className="mt-1" placeholder="e.g. Client kickoff call" />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Starts</Label>
              <div className="mt-1 flex gap-2">
                <Input type="date" value={startDate} onChange={(event) => setStart(event.target.value, startTime)} />
                <Input type="time" value={startTime} onChange={(event) => setStart(startDate, event.target.value)} />
              </div>
            </div>
            <div>
              <Label>Ends</Label>
              <div className="mt-1 flex gap-2">
                <Input type="date" value={endDate} onChange={(event) => setEnd(event.target.value, endTime)} />
                <Input type="time" value={endTime} onChange={(event) => setEnd(endDate, event.target.value)} />
              </div>
            </div>
          </div>
          {errors.endTime && <p className="-mt-2 text-xs text-rose-600">{errors.endTime.message}</p>}

          <div>
            <Label>Location</Label>
            <Input {...register('location')} className="mt-1" placeholder="Room, address, or meeting link" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              rows={3}
              className="mt-1 resize-none"
              placeholder="Agenda, dial-in details, anything worth having to hand…"
            />
          </div>

          <div>
            <Label>Project</Label>
            <Select
              value={selectedProjectId ?? 'none'}
              onValueChange={(value) => setValue('projectId', value === 'none' ? null : value, { shouldDirty: true })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

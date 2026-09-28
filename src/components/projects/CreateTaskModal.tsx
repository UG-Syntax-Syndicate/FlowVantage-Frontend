import { useState, type KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { CreateTaskInputSchema, type CreateTaskInput, type Member } from '../../types/project'
import { useCreateTask } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { PriorityToggleGroup } from '../common/PriorityToggleGroup'
import { DatePickerField } from '../common/DatePickerField'
import { DateTimeInputRow } from '../common/DateTimeInputRow'
import { TimeZoneCombobox } from '../common/TimeZoneCombobox'
import { showToast } from '../../lib/toast'
import { getBrowserTimeZone, zonedDateTimeToUtcIso } from '../../lib/timezone'

interface CreateTaskModalProps {
  projectId: string
  members: Member[]
  onClose: () => void
}

export function CreateTaskModal({ projectId, members, onClose }: CreateTaskModalProps) {
  const createTask = useCreateTask()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskInputSchema),
    defaultValues: {
      title: '',
      priority: 'medium',
      assigneeId: members[0]?.id ?? '',
      tags: [],
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  })

  const selectedPriority = watch('priority')
  const selectedAssigneeId = watch('assigneeId')
  const selectedTags = watch('tags')
  const [tagDraft, setTagDraft] = useState('')

  const [startDateStr, setStartDateStr] = useState(watch('startDate').slice(0, 10))
  const [dueDateStr, setDueDateStr] = useState(watch('dueDate').slice(0, 10))
  const [timed, setTimed] = useState(false)
  const [startTimeStr, setStartTimeStr] = useState('09:00')
  const [dueTimeStr, setDueTimeStr] = useState('10:00')
  const [timeZone, setTimeZone] = useState(getBrowserTimeZone)

  function commitDates(nextStartDateStr: string, nextDueDateStr: string, nextTimed: boolean, nextStartTimeStr: string, nextDueTimeStr: string, nextTimeZone: string) {
    setValue(
      'startDate',
      nextTimed ? zonedDateTimeToUtcIso(nextStartDateStr, nextStartTimeStr, nextTimeZone) : new Date(`${nextStartDateStr}T00:00:00`).toISOString(),
    )
    setValue(
      'dueDate',
      nextTimed ? zonedDateTimeToUtcIso(nextDueDateStr, nextDueTimeStr, nextTimeZone) : new Date(`${nextDueDateStr}T00:00:00`).toISOString(),
    )
  }

  function updateStartDate(dateStr: string) {
    setStartDateStr(dateStr)
    commitDates(dateStr, dueDateStr, timed, startTimeStr, dueTimeStr, timeZone)
  }
  function updateDueDate(dateStr: string) {
    setDueDateStr(dateStr)
    commitDates(startDateStr, dateStr, timed, startTimeStr, dueTimeStr, timeZone)
  }
  function updateTimed(next: boolean) {
    setTimed(next)
    commitDates(startDateStr, dueDateStr, next, startTimeStr, dueTimeStr, timeZone)
  }
  function updateStartTime(timeStr: string) {
    setStartTimeStr(timeStr)
    commitDates(startDateStr, dueDateStr, timed, timeStr, dueTimeStr, timeZone)
  }
  function updateDueTime(timeStr: string) {
    setDueTimeStr(timeStr)
    commitDates(startDateStr, dueDateStr, timed, startTimeStr, timeStr, timeZone)
  }
  function updateTimeZone(next: string) {
    setTimeZone(next)
    commitDates(startDateStr, dueDateStr, timed, startTimeStr, dueTimeStr, next)
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTask.mutateAsync({ projectId, input: values })
      showToast('success', 'Task added')
      onClose()
    } catch {
      showToast('error', 'Could not add task')
    }
  })

  function addTag() {
    const tag = tagDraft.trim()
    if (!tag || selectedTags.includes(tag)) {
      setTagDraft('')
      return
    }
    setValue('tags', [...selectedTags, tag])
    setTagDraft('')
  }

  function removeTag(tag: string) {
    setValue(
      'tags',
      selectedTags.filter((t) => t !== tag),
    )
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    } else if (event.key === 'Backspace' && tagDraft === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1])
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input {...register('title')} className="mt-1" placeholder="e.g. Write launch announcement" />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label>Priority</Label>
            <div className="mt-2">
              <PriorityToggleGroup value={selectedPriority} onChange={(next) => setValue('priority', next)} />
            </div>
          </div>

          <div>
            <Label>Assignee</Label>
            <Select value={selectedAssigneeId} onValueChange={(next) => setValue('assigneeId', next)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Choose an assignee" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigneeId && <p className="mt-1 text-xs text-rose-600">{errors.assigneeId.message}</p>}
          </div>

          <div>
            <Label>Tags</Label>
            <p className="mt-1 text-xs text-slate-400">
              Tags color-code this task on the calendar, separately from its project or assignee.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/10"
                  >
                    <X size={11} />
                  </button>
                </Badge>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={selectedTags.length === 0 ? 'e.g. design, launch…' : ''}
                className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {!timed && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <div className="mt-1">
                  <DatePickerField value={new Date(`${startDateStr}T00:00:00`).toISOString()} onChange={(iso) => updateStartDate(iso.slice(0, 10))} />
                </div>
              </div>
              <div>
                <Label>Due date</Label>
                <div className="mt-1">
                  <DatePickerField
                    value={new Date(`${dueDateStr}T00:00:00`).toISOString()}
                    onChange={(iso) => updateDueDate(iso.slice(0, 10))}
                    minDate={new Date(`${startDateStr}T00:00:00`).toISOString()}
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center justify-between gap-3 rounded-lg border border-input p-3">
            <span>
              <span className="block text-sm font-medium">Schedule at a specific time</span>
              <span className="block text-xs text-slate-400">Shows on the calendar like a meeting.</span>
            </span>
            <Switch checked={timed} onCheckedChange={updateTimed} />
          </label>

          {timed && (
            <div className="flex flex-col gap-3">
              <div>
                <Label>Timezone</Label>
                <div className="mt-1">
                  <TimeZoneCombobox value={timeZone} onChange={updateTimeZone} />
                </div>
              </div>
              <DateTimeInputRow
                label="Start"
                dateValue={new Date(`${startDateStr}T00:00:00`).toISOString()}
                timeValue={startTimeStr}
                onDateChange={(iso) => updateStartDate(iso.slice(0, 10))}
                onTimeChange={updateStartTime}
              />
              <DateTimeInputRow
                label="Due"
                dateValue={new Date(`${dueDateStr}T00:00:00`).toISOString()}
                timeValue={dueTimeStr}
                onDateChange={(iso) => updateDueDate(iso.slice(0, 10))}
                onTimeChange={updateDueTime}
                minDate={new Date(`${startDateStr}T00:00:00`).toISOString()}
              />
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createTask.isPending} disabled={createTask.isPending}>
              {createTask.isPending ? 'Adding…' : 'Add task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

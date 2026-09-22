import { useEffect, useState, type KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { CreateTaskInputSchema, type CreateTaskInput, type Member, type Priority } from '../../types/project'
import { useCreateTask } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'urgent']

/** Combines a `yyyy-mm-dd` date with an optional `hh:mm` time into an ISO string; no time = local midnight (all-day). */
function combineDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr || '00:00'}:00`).toISOString()
}

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
      assigneeIds: members[0] ? [members[0].id] : [],
      tags: [],
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  })

  const selectedPriority = watch('priority')
  const selectedAssigneeIds = watch('assigneeIds')
  const selectedTags = watch('tags')
  const [tagDraft, setTagDraft] = useState('')

  const [startDateStr, setStartDateStr] = useState(watch('startDate').slice(0, 10))
  const [dueDateStr, setDueDateStr] = useState(watch('dueDate').slice(0, 10))
  const [timed, setTimed] = useState(false)
  const [startTimeStr, setStartTimeStr] = useState('09:00')
  const [dueTimeStr, setDueTimeStr] = useState('10:00')

  useEffect(() => {
    setValue('startDate', combineDateTime(startDateStr, timed ? startTimeStr : ''))
  }, [startDateStr, startTimeStr, timed, setValue])

  useEffect(() => {
    setValue('dueDate', combineDateTime(dueDateStr, timed ? dueTimeStr : ''))
  }, [dueDateStr, dueTimeStr, timed, setValue])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTask.mutateAsync({ projectId, input: values })
      showToast('success', 'Task added')
      onClose()
    } catch {
      showToast('error', 'Could not add task')
    }
  })

  function toggleAssignee(id: string) {
    const next = selectedAssigneeIds.includes(id)
      ? selectedAssigneeIds.filter((assigneeId) => assigneeId !== id)
      : [...selectedAssigneeIds, id]
    setValue('assigneeIds', next)
  }

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
            <div className="mt-2 flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setValue('priority', priority)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    selectedPriority === priority
                      ? 'border-primary bg-accent-50 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Assignees</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => toggleAssignee(member.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedAssigneeIds.includes(member.id)
                      ? 'border-primary bg-accent-50 text-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <p className="mt-1 text-xs text-slate-400">
              Tags color-code this task on the calendar, separately from its project or assignee.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-accent-50 py-1 pr-1 pl-2.5 text-xs font-medium text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/10"
                  >
                    <X size={11} />
                  </button>
                </span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDateStr} onChange={(e) => setDueDateStr(e.target.value)} className="mt-1" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary/40"
            />
            Schedule at a specific time (shows on the calendar like a meeting)
          </label>

          {timed && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start time</Label>
                <Input type="time" value={startTimeStr} onChange={(e) => setStartTimeStr(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Due time</Label>
                <Input type="time" value={dueTimeStr} onChange={(e) => setDueTimeStr(e.target.value)} className="mt-1" />
              </div>
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

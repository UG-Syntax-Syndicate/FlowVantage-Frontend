import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateTaskInputSchema, type CreateTaskInput, type Member, type Priority } from '../../types/project'
import { useCreateTask } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high', 'urgent']

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
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
  })

  const selectedPriority = watch('priority')
  const selectedAssigneeIds = watch('assigneeIds')

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                defaultValue={watch('startDate').slice(0, 10)}
                onChange={(e) => setValue('startDate', new Date(e.target.value).toISOString())}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                defaultValue={watch('dueDate').slice(0, 10)}
                onChange={(e) => setValue('dueDate', new Date(e.target.value).toISOString())}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Adding…' : 'Add task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

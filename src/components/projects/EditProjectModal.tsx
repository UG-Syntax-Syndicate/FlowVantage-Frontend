import { useState, type KeyboardEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import {
  UpdateProjectInputSchema,
  type Priority,
  type Project,
  type ProjectStatus,
  type ProjectVisibility,
  type UpdateProjectInput,
} from '../../types/project'
import { useUpdateProject } from '../../hooks/useProjectsData'
import { useWorkspace } from '../../hooks/useWorkspace'
import { PRIORITY_META, PROJECT_STATUS_META } from '../../types/statusMeta'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { showToast } from '../../lib/toast'

const STATUS_OPTIONS = Object.keys(PROJECT_STATUS_META) as ProjectStatus[]
const PRIORITY_OPTIONS = Object.keys(PRIORITY_META) as Priority[]

interface EditProjectModalProps {
  project: Project
  onClose: () => void
}

/**
 * Edits a project's own fields. Deliberately not the mirror of
 * CreateProjectModal: the cover image has its own uploader on the detail page
 * and folder membership its own dropdown, so both are left out here rather
 * than offering a second way to change them.
 */
export function EditProjectModal({ project, onClose }: EditProjectModalProps) {
  const updateProject = useUpdateProject()
  const { activeWorkspace } = useWorkspace()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectInputSchema),
    defaultValues: {
      name: project.name,
      tagline: project.tagline,
      description: project.description,
      status: project.status,
      category: project.category,
      priority: project.priority,
      tags: project.tags,
      startDate: project.startDate,
      dueDate: project.dueDate,
      visibility: project.visibility,
    },
  })

  const selectedStatus = watch('status')
  const selectedPriority = watch('priority')
  const selectedVisibility = watch('visibility')
  const selectedTags = watch('tags') ?? []
  const [tagDraft, setTagDraft] = useState('')

  // The date inputs work in `yyyy-mm-dd`; the stored values are ISO strings.
  const [startDateStr, setStartDateStr] = useState(project.startDate.slice(0, 10))
  const [dueDateStr, setDueDateStr] = useState(project.dueDate.slice(0, 10))

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProject.mutateAsync({ projectId: project.id, input: values })
      showToast('success', 'Project updated')
      onClose()
    } catch {
      showToast('error', 'Could not save this project')
    }
  })

  function addTag() {
    const tag = tagDraft.trim()
    if (!tag || selectedTags.includes(tag)) {
      setTagDraft('')
      return
    }
    setValue('tags', [...selectedTags, tag], { shouldDirty: true })
    setTagDraft('')
  }

  function removeTag(tag: string) {
    setValue(
      'tags',
      selectedTags.filter((existing) => existing !== tag),
      { shouldDirty: true },
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="Project name" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Tagline</Label>
            <Input {...register('tagline')} className="mt-1" placeholder="One line describing this project" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} rows={3} className="mt-1 resize-none" placeholder="What is this project for?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setValue('status', value as ProjectStatus, { shouldDirty: true })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_META[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={selectedPriority} onValueChange={(value) => setValue('priority', value as Priority, { shouldDirty: true })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_META[priority].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Category</Label>
            <Input {...register('category')} className="mt-1" placeholder="e.g. Marketing" />
          </div>

          <div>
            <Label>Tags</Label>
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
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={selectedTags.length === 0 ? 'e.g. launch, q4…' : ''}
                className="min-w-[6rem] flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input
                type="date"
                value={startDateStr}
                onChange={(event) => {
                  setStartDateStr(event.target.value)
                  if (event.target.value) {
                    setValue('startDate', new Date(`${event.target.value}T00:00:00`).toISOString(), { shouldDirty: true })
                  }
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDateStr}
                onChange={(event) => {
                  setDueDateStr(event.target.value)
                  if (event.target.value) {
                    setValue('dueDate', new Date(`${event.target.value}T00:00:00`).toISOString(), { shouldDirty: true })
                  }
                }}
                className="mt-1"
              />
            </div>
          </div>

          {activeWorkspace && !activeWorkspace.isPersonal && (
            <div>
              <Label>Visibility</Label>
              <Select
                value={selectedVisibility ?? 'private'}
                onValueChange={(value) => setValue('visibility', value as ProjectVisibility, { shouldDirty: true })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Only me</SelectItem>
                  <SelectItem value="workspace">Everyone in this workspace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={updateProject.isPending} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

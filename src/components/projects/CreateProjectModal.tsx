import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import { CreateProjectInputSchema, type CreateProjectInput } from '../../types/project'
import { useCreateProject, useMembers } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'
import { convertImageToWebp, validateImageFile } from '../../lib/images'

interface CreateProjectModalProps {
  onClose: () => void
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { data: members = [] } = useMembers()
  const createProject = useCreateProject()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectInputSchema),
    defaultValues: {
      name: '',
      description: '',
      image: null,
      memberIds: [],
      startDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    },
  })

  const selectedImage = watch('image')
  const selectedMemberIds = watch('memberIds')

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      showToast('error', validationError)
      return
    }
    try {
      setValue('image', await convertImageToWebp(file))
    } catch {
      showToast('error', 'Could not read that image')
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createProject.mutateAsync(values)
      showToast('success', 'Project created')
      onClose()
    } catch {
      showToast('error', 'Could not create project')
    }
  })

  function toggleMember(id: string) {
    const next = selectedMemberIds.includes(id)
      ? selectedMemberIds.filter((memberId) => memberId !== id)
      : [...selectedMemberIds, id]
    setValue('memberIds', next)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="e.g. Website Relaunch" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...register('description')}
              rows={2}
              className="mt-1 resize-none"
              placeholder="What is this project about?"
            />
          </div>

          <div>
            <Label>Cover image</Label>
            {selectedImage ? (
              <div className="relative mt-2 h-28 w-full overflow-hidden rounded-lg">
                <img src={selectedImage} alt="Cover preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setValue('image', null)}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary">
                <ImagePlus size={20} strokeWidth={1.7} />
                <span className="text-xs font-medium">Upload a cover image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
            {!selectedImage && (
              <p className="mt-1 text-xs text-slate-400">
                PNG, JPEG, GIF, or WEBP. Max 5MB — converted to WEBP. No image? We&apos;ll assign a default gradient
                cover.
              </p>
            )}
          </div>

          <div>
            <Label>Members</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    selectedMemberIds.includes(member.id)
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
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContactInputSchema, type ContactInput, type ContactVisibility } from '../../types/project'
import { useCreateContact, useProjects } from '../../hooks/useProjectsData'
import { useWorkspace } from '../../hooks/useWorkspace'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { showToast } from '../../lib/toast'

interface AddContactModalProps {
  onClose: () => void
}

export function AddContactModal({ onClose }: AddContactModalProps) {
  const createContact = useCreateContact()
  const { data: projects = [] } = useProjects()
  const { activeWorkspace } = useWorkspace()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactInputSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      role: '',
      notes: '',
      workspaceId: activeWorkspace?.id,
      visibility: 'private',
      projectId: null,
    },
  })

  const selectedProjectId = watch('projectId')
  const selectedVisibility = watch('visibility')

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createContact.mutateAsync(values)
      showToast('success', 'Contact added')
      onClose()
    } catch {
      showToast('error', 'Could not add this contact')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First name</Label>
              <Input {...register('firstName')} className="mt-1" placeholder="Jane" />
              {errors.firstName && <p className="mt-1 text-xs text-rose-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label>Last name</Label>
              <Input {...register('lastName')} className="mt-1" placeholder="Doe" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input {...register('email')} type="email" className="mt-1" placeholder="jane@example.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register('phone')} className="mt-1" placeholder="+1 555 000 0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Input {...register('company')} className="mt-1" placeholder="Acme Inc." />
            </div>
            <div>
              <Label>Role</Label>
              <Input {...register('role')} className="mt-1" placeholder="Marketing Lead" />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} className="mt-1 resize-none" placeholder="Anything worth remembering…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tag to project</Label>
              <Select
                value={selectedProjectId ?? 'none'}
                onValueChange={(value) => setValue('projectId', value === 'none' ? null : value)}
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
            {activeWorkspace && !activeWorkspace.isPersonal && (
              <div>
                <Label>Visibility</Label>
                <Select
                  value={selectedVisibility ?? 'private'}
                  onValueChange={(v) => setValue('visibility', v as ContactVisibility)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Only me</SelectItem>
                    <SelectItem value="shared">Shared with workspace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createContact.isPending} disabled={createContact.isPending}>
              {createContact.isPending ? 'Adding…' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

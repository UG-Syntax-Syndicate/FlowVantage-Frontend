import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateFolderInputSchema, type CreateFolderInput, type FolderIcon } from '../../types/project'
import { useCreateFolder } from '../../hooks/useProjectsData'
import { FOLDER_COLOR_PALETTE } from '../../mocks/seedData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'
import { FOLDER_ICONS } from '../../lib/folderIcons'

const ICON_OPTIONS = Object.keys(FOLDER_ICONS) as FolderIcon[]

interface CreateFolderModalProps {
  onClose: () => void
}

export function CreateFolderModal({ onClose }: CreateFolderModalProps) {
  const createFolder = useCreateFolder()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFolderInput>({
    resolver: zodResolver(CreateFolderInputSchema),
    defaultValues: { name: '', icon: ICON_OPTIONS[0], color: FOLDER_COLOR_PALETTE[0] },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createFolder.mutateAsync(values)
      showToast('success', 'Folder created')
      onClose()
    } catch {
      showToast('error', 'Could not create folder')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Name</Label>
            <Input {...register('name')} className="mt-1" placeholder="e.g. Marketing" />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Icon</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => {
                const Icon = FOLDER_ICONS[icon]
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                      selectedIcon === icon
                        ? 'border-primary bg-accent-50 text-primary'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.9} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label>Color</Label>
            <div className="mt-2 flex gap-2">
              {FOLDER_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                  className={`h-7 w-7 rounded-full transition ${
                    selectedColor === color ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFolder.isPending}>
              {createFolder.isPending ? 'Creating…' : 'Create folder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

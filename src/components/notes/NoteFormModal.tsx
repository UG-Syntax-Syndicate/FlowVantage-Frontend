import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NoteInputSchema, type Note, type NoteInput } from '../../types/project'
import { useCreateNote, useUpdateNote } from '../../hooks/useProjectsData'
import { NOTE_COLORS, NOTE_COLOR_ORDER } from '../../lib/noteColors'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'

interface NoteFormModalProps {
  note?: Note
  onClose: () => void
}

export function NoteFormModal({ note, onClose }: NoteFormModalProps) {
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const isEditing = Boolean(note)
  const isPending = createNote.isPending || updateNote.isPending

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NoteInput>({
    resolver: zodResolver(NoteInputSchema),
    defaultValues: {
      title: note?.title ?? '',
      body: note?.body ?? '',
      color: note?.color ?? NOTE_COLOR_ORDER[0],
    },
  })

  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (note) {
        await updateNote.mutateAsync({ noteId: note.id, input: values })
        showToast('success', 'Note updated')
      } else {
        await createNote.mutateAsync(values)
        showToast('success', 'Note added')
      }
      onClose()
    } catch {
      showToast('error', 'Could not save this note')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input {...register('title')} className="mt-1" placeholder="The title of a note" />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label>Note</Label>
            <Textarea {...register('body')} rows={6} className="mt-1 resize-none" placeholder="Write your note…" />
          </div>

          <div>
            <Label>Change Note Color</Label>
            <div className="mt-2 flex gap-2.5">
              {NOTE_COLOR_ORDER.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  aria-label={NOTE_COLORS[color].label}
                  className={`h-8 w-8 rounded-full ${NOTE_COLORS[color].badgeBg} flex items-center justify-center transition ${
                    selectedColor === color ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                >
                  {selectedColor === color && <span className="h-2 w-2 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ComposeEmailInputSchema, type ComposeEmailInput } from '../../types/project'
import { useComposeEmail } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'

interface ComposeMailModalProps {
  onClose: () => void
}

export function ComposeMailModal({ onClose }: ComposeMailModalProps) {
  const composeEmail = useComposeEmail()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComposeEmailInput>({
    resolver: zodResolver(ComposeEmailInputSchema),
    defaultValues: { to: '', subject: '', snippet: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await composeEmail.mutateAsync(values)
      showToast('success', 'Saved to Drafts')
      onClose()
    } catch {
      showToast('error', 'Could not save this email')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Mail</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label>To</Label>
            <Input {...register('to')} className="mt-1" placeholder="name@company.com" />
            {errors.to && <p className="mt-1 text-xs text-rose-600">{errors.to.message}</p>}
          </div>

          <div>
            <Label>Subject</Label>
            <Input {...register('subject')} className="mt-1" placeholder="What is this about?" />
            {errors.subject && <p className="mt-1 text-xs text-rose-600">{errors.subject.message}</p>}
          </div>

          <div>
            <Label>Message</Label>
            <Textarea {...register('snippet')} rows={4} className="mt-1 resize-none" placeholder="Write your message…" />
          </div>

          <p className="text-xs text-slate-400">
            Sending isn&apos;t wired up yet — this saves to Drafts so you can see the flow end-to-end.
          </p>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={composeEmail.isPending}>
              {composeEmail.isPending ? 'Saving…' : 'Save to Drafts'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

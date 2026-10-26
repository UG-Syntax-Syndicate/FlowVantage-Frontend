import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Send } from 'lucide-react'
import { ComposeEmailInputSchema, type ComposeEmailInput } from '../../types/project'
import { useComposeEmail, useEmailSender, useSendEmail } from '../../hooks/useProjectsData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { showToast } from '../../lib/toast'

interface ComposeMailModalProps {
  /** Prefills the recipient, e.g. when composing from a contact. */
  defaultTo?: string
  /** Shown above the form when the recipient came from a contact. */
  contactName?: string
  /** Files the sent copy against this contact, when composing from one. */
  contactId?: string | null
  /** Files the sent copy against this project. */
  projectId?: string | null
  onClose: () => void
}

/** One line saying where the message will actually leave from. */
function senderNotice(
  sender: { via: string | null; name: string | null; address: string | null; canSend: boolean } | undefined,
  onClose: () => void,
) {
  if (!sender) {
    return <span className="text-slate-400">Checking which mailbox this would send from…</span>
  }

  if (sender.via === 'gmail' || sender.via === 'outlook') {
    return (
      <>
        Sending as <span className="font-medium text-slate-700">{sender.address ?? sender.name}</span> through{' '}
        {sender.name}. It will appear in your own Sent folder.
      </>
    )
  }

  if (sender.via === 'smtp') {
    return (
      <>
        No mailbox is connected, so this goes out through {sender.name} with your address in Reply-To. Connect
        one under{' '}
        <Link to="/dashboard/account/integrations" onClick={onClose} className="font-medium text-primary hover:underline">
          Settings → Integrations
        </Link>{' '}
        to send from your own address.
      </>
    )
  }

  return (
    <>
      There is no mailbox to send through yet, so this can only be saved as a draft. Connect one under{' '}
      <Link to="/dashboard/account/integrations" onClick={onClose} className="font-medium text-primary hover:underline">
        Settings → Integrations
      </Link>
      .
    </>
  )
}

export function ComposeMailModal({
  defaultTo,
  contactName,
  contactId = null,
  projectId = null,
  onClose,
}: ComposeMailModalProps) {
  const composeEmail = useComposeEmail()
  const sendEmail = useSendEmail()
  const { data: sender } = useEmailSender()

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ComposeEmailInput>({
    resolver: zodResolver(ComposeEmailInputSchema),
    defaultValues: { to: defaultTo ?? '', subject: '', snippet: '' },
  })

  const busy = composeEmail.isPending || sendEmail.isPending

  const onSubmit = handleSubmit(async (values) => {
    try {
      await sendEmail.mutateAsync({ ...values, contactId, projectId })
      showToast('success', 'Sent')
      onClose()
    } catch (error) {
      // The server distinguishes "nothing to send through" from "the provider
      // rejected it", and both are things the user can act on, so its message
      // is shown rather than a generic one.
      showToast('error', error instanceof Error ? error.message : 'Could not send this email')
    }
  })

  // Not handleSubmit: saving a draft should not be blocked by the same
  // validation as sending, since an unfinished draft is the normal case.
  async function saveDraft() {
    if (!(await trigger('to'))) return
    try {
      await composeEmail.mutateAsync(getValues())
      showToast('success', 'Saved to Drafts')
      onClose()
    } catch {
      showToast('error', 'Could not save this draft')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contactName ? `Email ${contactName}` : 'New Mail'}</DialogTitle>
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

          {/* Said before pressing Send, not after: which address a message
              leaves from is the thing people are most surprised by. */}
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            {senderNotice(sender, onClose)}
          </p>

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={saveDraft} loading={composeEmail.isPending} disabled={busy}>
              Save draft
            </Button>
            <Button type="submit" loading={sendEmail.isPending} disabled={busy || sender?.canSend === false}>
              <Send size={14} strokeWidth={2} />
              {sendEmail.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

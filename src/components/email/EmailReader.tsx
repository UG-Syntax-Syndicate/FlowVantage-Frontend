import { ExternalLink, FolderInput, Paperclip, Star, TriangleAlert } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { Avatar } from '../common/Avatar'
import { pickAvatar } from '../../lib/avatars'
import { emailDocument, useEmailContent } from '../../features/email/content'
import { FileToProjectMenu } from '../../features/integrations/components/FileToProjectMenu'
import { useFileItems } from '../../features/integrations/hooks'
import { showToast } from '../../lib/toast'
import type { Email, Project } from '../../types/project'

interface EmailReaderProps {
  email: Email | null
  project?: Project
  onClose: () => void
  onToggleStar: (emailId: string) => void
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** The full message, opened from a row in the mail list. */
export function EmailReader({ email, project, onClose, onToggleStar }: EmailReaderProps) {
  const content = useEmailContent(email?.id ?? null)
  const fileItems = useFileItems()

  function fileTo(projectId: string | null) {
    if (!email) return
    fileItems.mutate(
      { items: [{ kind: 'email', id: email.id }], projectId },
      {
        onSuccess: () => showToast('success', projectId ? 'Filed to the project' : 'Removed from the project'),
        onError: (error) => showToast('error', 'Could not file this email', error instanceof Error ? error.message : undefined),
      },
    )
  }

  return (
    <Sheet open={Boolean(email)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        {email && (
          <>
            <SheetHeader className="gap-3 border-b border-line px-6 pt-6 pb-4">
              <SheetTitle className="pr-10 text-lg leading-snug font-semibold text-slate-900">
                {email.subject || '(no subject)'}
              </SheetTitle>
              <div className="flex items-start gap-3">
                <Avatar photoURL={pickAvatar(email.senderName)} name={email.senderName} size={36} bgColor={email.senderColor} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium text-slate-800">
                    {email.senderName}
                    {email.senderEmail && email.senderEmail !== email.senderName && (
                      <span className="font-normal text-slate-500"> &lt;{email.senderEmail}&gt;</span>
                    )}
                  </p>
                  <SheetDescription className="truncate text-xs text-slate-500">
                    {content.data?.to ? `To ${content.data.to}` : null}
                    {content.data?.cc ? ` · Cc ${content.data.cc}` : null}
                  </SheetDescription>
                  <p className="text-xs text-slate-400">{new Date(email.receivedAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => onToggleStar(email.id)}>
                  <Star size={14} className={email.starred ? 'fill-amber-400 text-amber-400' : ''} />
                  {email.starred ? 'Starred' : 'Star'}
                </Button>
                <FileToProjectMenu
                  canUnfile={Boolean(email.projectId)}
                  disabled={fileItems.isPending}
                  onSelect={fileTo}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <FolderInput size={14} />
                      {project ? project.name : 'File to project'}
                    </Button>
                  }
                />
                {content.data?.webUrl && (
                  <Button type="button" variant="ghost" size="sm" asChild>
                    <a href={content.data.webUrl} target="_blank" rel="noreferrer noopener">
                      <ExternalLink size={14} />
                      Open in {email.source === 'outlook' ? 'Outlook' : 'Gmail'}
                    </a>
                  </Button>
                )}
              </div>
            </SheetHeader>

            {content.data && !content.data.complete && (
              <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-800">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                <span>Only a preview is available. {content.data.error}</span>
              </div>
            )}

            {content.data && content.data.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-line px-6 py-3">
                {content.data.attachments.map((attachment, index) => (
                  <span
                    key={`${attachment.filename}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
                  >
                    <Paperclip size={12} />
                    {attachment.filename}
                    {attachment.size ? <span className="text-slate-400">{formatSize(attachment.size)}</span> : null}
                  </span>
                ))}
              </div>
            )}

            <div className="min-h-0 flex-1">
              {content.isLoading && (
                <div className="flex flex-col gap-3 p-6">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}
              {content.isError && (
                <p className="p-6 text-sm text-rose-600">
                  {content.error instanceof Error ? content.error.message : 'Could not open this email'}
                </p>
              )}
              {content.data && (
                <iframe
                  title={`Email: ${email.subject}`}
                  // No allow-scripts, no allow-same-origin: the sender's HTML
                  // can render but never run code or reach this app.
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                  srcDoc={emailDocument(content.data)}
                  className="h-full w-full border-0 bg-white"
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

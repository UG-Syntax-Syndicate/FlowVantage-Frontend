import { useState } from 'react'
import { ExternalLink, Info, TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { IntegrationIcon } from './IntegrationIcon'
import { CREDENTIAL_GUIDES } from './credentialGuides'
import { useSaveConnectionCredentials } from '../../../hooks/useIntegrationsData'
import type { IntegrationConnection } from '../../../types/integrations'
import type { IntegrationIconName } from './IntegrationIcon'
import { showToast } from '../../../lib/toast'

interface CredentialConnectModalProps {
  connection: IntegrationConnection
  icon: IntegrationIconName
  onClose: () => void
}

/**
 * Connect dialog for the vendors with no sign-in flow (Yuki, PerfectView).
 *
 * The instructions sit beside the fields rather than behind a help link,
 * because the hard part of these two integrations is not pasting a key - it is
 * finding the screen that shows it. Both are role-gated, and both hide the
 * credentials behind a menu most users have never opened.
 */
export function CredentialConnectModal({ connection, icon, onClose }: CredentialConnectModalProps) {
  const saveCredentials = useSaveConnectionCredentials(connection.id)
  const guide = CREDENTIAL_GUIDES[connection.id]
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const fields = connection.credentialFields ?? []
  const allFilled = fields.every((field) => (values[field.name] ?? '').trim().length > 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await saveCredentials.mutateAsync(values)
      showToast('success', `${connection.name} connected`)
      onClose()
    } catch (caught) {
      // The server names the field that is wrong, which beats a generic toast.
      setError(caught instanceof Error ? caught.message : 'Could not save these credentials')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <IntegrationIcon name={icon} />
            <DialogTitle>Connect {connection.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid max-h-[65vh] grid-cols-1 gap-6 overflow-y-auto md:grid-cols-2">
          {guide && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{guide.where}</h3>

              <ol className="flex flex-col gap-2.5">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-50 text-[11px] font-semibold text-accent-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {guide.roleNote && (
                <p className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
                  <Info size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
                  {guide.roleNote}
                </p>
              )}

              {guide.warning && (
                <p className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                  <TriangleAlert size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
                  {guide.warning}
                </p>
              )}

              <a
                href={guide.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                {guide.docsLabel}
                <ExternalLink size={12} strokeWidth={2} />
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <Label>{field.label}</Label>
                <Input
                  type={field.secret ? 'password' : 'text'}
                  value={values[field.name] ?? ''}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                  className="mt-1 font-mono text-sm"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={field.secret ? '••••••••••••' : ''}
                />
                {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
              </div>
            ))}

            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
              These are encrypted before they are stored, and are never shown again. You can disconnect at any time,
              which deletes them.
            </p>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="mt-auto flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={saveCredentials.isPending}
                disabled={!allFilled || saveCredentials.isPending}
              >
                {saveCredentials.isPending ? 'Connecting…' : `Connect ${connection.name}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

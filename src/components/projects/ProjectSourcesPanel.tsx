import { useState } from 'react'
import { ExternalLink, Link2, Mail, Plug, Plus, RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { showToast } from '../../lib/toast'
import { formatCompactAgo } from '../../lib/formatDate'
import {
  useConnections,
  useCreateProjectLink,
  useDeleteProjectLink,
  useProjectSourceLinks,
  useSyncSkips,
} from '../../hooks/useIntegrationsData'
import { useInbox, useRequestSync } from '../../features/integrations/hooks'

/**
 * Which kind of thing can be linked, per provider.
 *
 * Each entry is the vendor's own word for it, because the id has to be
 * copied out of that vendor's interface and anything we renamed it to would
 * make it harder to find.
 */
const SOURCE_KINDS: Record<
  string,
  { kind: string; label: string; placeholder: string; hint: string }[]
> = {
  gmail: [
    {
      kind: 'label',
      label: 'Gmail label',
      placeholder: 'Label_12',
      hint: 'The label id, which appears in the Gmail URL while that label is open.',
    },
  ],
  outlook: [
    {
      kind: 'category',
      label: 'Outlook category',
      placeholder: 'Checkout',
      hint: 'The category name, exactly as it appears on the message.',
    },
  ],
  slack: [
    {
      kind: 'channel',
      label: 'Slack channel',
      placeholder: 'C04AB12CD',
      hint: 'The channel id, at the bottom of the channel details panel.',
    },
  ],
  zoom: [
    {
      kind: 'calendar',
      label: 'Zoom account',
      placeholder: 'your Zoom account or user id',
      hint: 'Meetings hosted on this account are filed against this project.',
    },
  ],
  dropbox: [
    {
      kind: 'folder',
      label: 'Dropbox folder',
      placeholder: '/Clients/Acme',
      hint: 'The folder path, as Dropbox shows it.',
    },
  ],
}

const PROVIDER_NAMES: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  slack: 'Slack',
  zoom: 'Zoom',
  dropbox: 'Dropbox',
  google_drive: 'Drive',
  perfectview: 'PerfectView',
  yuki: 'Yuki',
}

/** Providers that have something to pull on demand. */

function AddSourceDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { data: connections = [] } = useConnections()
  const createLink = useCreateProjectLink(projectId)

  const connected = connections.filter((connection) => connection.connected && SOURCE_KINDS[connection.id])
  const [provider, setProvider] = useState(connected[0]?.id ?? '')
  const [sourceId, setSourceId] = useState('')
  const [sourceLabel, setSourceLabel] = useState('')

  const kinds = SOURCE_KINDS[provider] ?? []
  const kind = kinds[0]

  async function submit() {
    if (!provider || !kind || !sourceId.trim()) return
    try {
      await createLink.mutateAsync({
        provider,
        sourceKind: kind.kind,
        sourceId: sourceId.trim(),
        sourceLabel: sourceLabel.trim() || null,
      })
      showToast('success', 'Source linked', 'New items from it will be filed against this project.')
      onClose()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not link that source')
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link a source to this project</DialogTitle>
          <DialogDescription>
            Anything arriving from it is filed here. Without a link, an item only lands on a project when
            someone involved is a contact or member on exactly one.
          </DialogDescription>
        </DialogHeader>

        {connected.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No provider that supports linking is connected yet. Connect one under Settings → Integrations.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {connected.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {connection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind && (
              <>
                <div>
                  <Label>{kind.label}</Label>
                  <Input
                    value={sourceId}
                    onChange={(event) => setSourceId(event.target.value)}
                    className="mt-1"
                    placeholder={kind.placeholder}
                  />
                  <p className="mt-1 text-xs text-slate-400">{kind.hint}</p>
                </div>

                <div>
                  <Label>Name it (optional)</Label>
                  <Input
                    value={sourceLabel}
                    onChange={(event) => setSourceLabel(event.target.value)}
                    className="mt-1"
                    placeholder="e.g. #checkout-redesign"
                  />
                  {/* Stored for display only. Matching is by id, so renaming
                      the channel at the vendor does not break the link. */}
                  <p className="mt-1 text-xs text-slate-400">Shown here only; matching always uses the id.</p>
                </div>
              </>
            )}

            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submit}
                loading={createLink.isPending}
                disabled={createLink.isPending || !sourceId.trim()}
              >
                Link source
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ProjectSourcesPanelProps {
  projectId: string
  canManage: boolean
}

/**
 * Which third-party sources feed this project, and what was recently turned
 * away.
 *
 * The skip list is the half that earns the panel: without it, "the email is
 * in Gmail but not here" has no answer anywhere in the product, and a filter
 * nobody can inspect is indistinguishable from a broken import.
 */
export function ProjectSourcesPanel({ projectId, canManage }: ProjectSourcesPanelProps) {
  const { data: links = [], isLoading } = useProjectSourceLinks(projectId)
  const { data: skipsResult } = useSyncSkips(20)
  const deleteLink = useDeleteProjectLink(projectId)
  const runSync = useRequestSync()
  const { data: connections = [] } = useConnections()
  const synced = useInbox({ kind: 'all', filed: 'any', projectId })
  const [adding, setAdding] = useState(false)

  const skips = skipsResult?.skips ?? []
  const syncable = new Set(connections.filter((connection) => connection.sync?.length > 0).map((connection) => connection.id))
  const providers = [...new Set(links.map((link) => link.provider))].filter((provider) => syncable.has(provider))
  const syncedItems = synced.data?.pages[0]?.items ?? []

  async function sync(provider: string) {
    try {
      await runSync.mutateAsync(provider)
      showToast('success', `${PROVIDER_NAMES[provider] ?? provider} sync started`, 'New items appear as they arrive.')
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not sync that provider')
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Plug size={15} strokeWidth={2} className="text-slate-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900">Connected sources</h2>
        </div>
        {canManage && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} strokeWidth={2} />
            Link a source
          </Button>
        )}
      </header>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <Link2 size={20} strokeWidth={1.8} className="text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">Nothing is linked to this project</p>
          <p className="max-w-sm text-xs text-slate-400">
            Mail, meetings and messages still arrive if someone involved is a contact on this project and no
            other. Linking a mailbox label or a channel makes it certain.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {link.source_label || link.source_id}
                </p>
                <p className="text-xs text-slate-400">
                  {PROVIDER_NAMES[link.provider] ?? link.provider} · {link.source_kind} ·{' '}
                  <span className="font-mono">{link.source_id}</span>
                </p>
              </div>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    deleteLink.mutate(link.id, {
                      onSuccess: () => showToast('success', 'Source unlinked'),
                      onError: () => showToast('error', 'Could not unlink that source'),
                    })
                  }
                  aria-label={`Unlink ${link.source_label || link.source_id}`}
                  title="Unlink"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {providers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-xs text-slate-400">Sync now:</span>
          {providers.map((provider) => (
            <Button
              key={provider}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => sync(provider)}
              loading={runSync.isPending && runSync.variables === provider}
              disabled={runSync.isPending}
            >
              <RefreshCw size={13} strokeWidth={2} />
              {PROVIDER_NAMES[provider] ?? provider}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-700">Synced into this project</h3>
          <Link to="/dashboard/email" className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline">
            <Mail size={12} strokeWidth={2} />
            File more from Email
          </Link>
        </div>
        {syncedItems.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nothing from a connected app is filed here yet. Items that match a linked source or a project contact
            arrive automatically; you can file the rest from Email.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {syncedItems.slice(0, 8).map((item) => (
              <li key={`${item.kind}:${item.id}`} className="flex items-center gap-2 text-sm">
                <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-slate-400">{item.kind}</span>
                <span className="min-w-0 flex-1 truncate text-slate-700">{item.title}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-600" aria-label={`Open ${item.title}`}>
                    <ExternalLink size={12} />
                  </a>
                )}
                <span className="shrink-0 text-xs text-slate-400">{PROVIDER_NAMES[item.provider] ?? item.provider}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {skips.length > 0 && (
        <details className="border-t border-line pt-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Could not be stored ({skips.length})
          </summary>
          <p className="mt-2 text-xs text-slate-400">
            Items a connected app offered that failed to save, with the reason. Kept for{' '}
            {skipsResult?.retentionDays ?? 30} days.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {skips.map((skip) => (
              <li key={skip.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <TriangleAlert size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {skip.summary || skip.external_id || '(no subject)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {skip.detail ?? skip.reason} · {formatCompactAgo(skip.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {adding && <AddSourceDialog projectId={projectId} onClose={() => setAdding(false)} />}
    </section>
  )
}

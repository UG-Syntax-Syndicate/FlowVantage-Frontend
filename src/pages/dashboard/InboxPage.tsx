import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  FolderInput,
  Inbox,
  Loader2,
  Mail,
  Receipt,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { EmptyState } from '../../components/common/EmptyState'
import { useConnections } from '../../hooks/useIntegrationsData'
import { showToast } from '../../lib/toast'
import { useFileItems, useInbox } from '../../features/integrations/hooks'
import { FileToProjectMenu } from '../../features/integrations/components/FileToProjectMenu'
import type { InboxFilters, InboxItem, InboxKind } from '../../features/integrations/types'

const TABS: Array<{ kind: InboxFilters['kind']; label: string }> = [
  { kind: 'all', label: 'All' },
  { kind: 'email', label: 'Mail' },
  { kind: 'event', label: 'Events' },
  { kind: 'file', label: 'Files' },
  { kind: 'contact', label: 'Contacts' },
  { kind: 'record', label: 'Records' },
]

const KIND_ICON: Record<InboxKind, LucideIcon> = {
  email: Mail,
  event: CalendarDays,
  file: FileText,
  contact: UserRound,
  record: Receipt,
}

const PROVIDER_NAMES: Record<string, string> = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  zoom: 'Zoom',
  google_drive: 'Drive',
  dropbox: 'Dropbox',
  perfectview: 'PerfectView',
  yuki: 'Yuki',
}

function itemKey(item: Pick<InboxItem, 'kind' | 'id'>): string {
  return `${item.kind}:${item.id}`
}

function formatWhen(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return format(date, sameYear ? 'd MMM' : 'd MMM yyyy')
}

/**
 * Everything synced from connected accounts that has not been filed into a
 * project yet. The sync keeps it all rather than guessing, so this is where a
 * person decides where the rest belongs.
 */
export function InboxPage() {
  const [kind, setKind] = useState<InboxFilters['kind']>('all')
  const [showFiled, setShowFiled] = useState(false)
  const [provider, setProvider] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filters: InboxFilters = { kind, provider, filed: showFiled ? 'any' : 'false' }
  const inbox = useInbox(filters)
  const fileItems = useFileItems()
  const { data: connections = [] } = useConnections()

  const items = useMemo(() => inbox.data?.pages.flatMap((page) => page.items) ?? [], [inbox.data])
  const unfiled = inbox.data?.pages[0]?.unfiled
  const totalUnfiled = unfiled ? Object.values(unfiled).reduce((sum, count) => sum + count, 0) : 0

  const syncingProviders = connections.filter((connection) => connection.connected && connection.sync.length > 0)
  const importing = syncingProviders.some((connection) =>
    connection.sync.some((resource) => resource.phase !== 'incremental' && !resource.lastError),
  )

  const selectedItems = items.filter((item) => selected.has(itemKey(item)))
  const allSelected = items.length > 0 && selectedItems.length === items.length

  function changeTab(next: InboxFilters['kind']) {
    setKind(next)
    setSelected(new Set())
  }

  function toggle(item: InboxItem) {
    setSelected((current) => {
      const next = new Set(current)
      const key = itemKey(item)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map(itemKey)))
  }

  async function file(targets: InboxItem[], projectId: string | null) {
    try {
      const { filed } = await fileItems.mutateAsync({
        items: targets.map(({ kind: itemKind, id }) => ({ kind: itemKind, id })),
        projectId,
      })
      setSelected(new Set())
      showToast('success', projectId ? `Filed ${filed} item${filed === 1 ? '' : 's'}` : 'Moved back to the inbox')
    } catch {
      showToast('error', 'Could not file those items')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title="Inbox" subtitle="What your connected apps brought in, waiting to be filed" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Item type">
          {TABS.map((tab) => {
            const count = tab.kind === 'all' ? totalUnfiled : (unfiled?.[tab.kind] ?? 0)
            const active = kind === tab.kind
            return (
              <button
                key={tab.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeTab(tab.kind)}
                className={
                  active
                    ? 'flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white'
                    : 'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100'
                }
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={
                      active
                        ? 'rounded-full bg-white/20 px-1.5 text-xs tabular-nums'
                        : 'rounded-full bg-slate-100 px-1.5 text-xs tabular-nums text-slate-500'
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Source"
            value={provider ?? ''}
            onChange={(event) => {
              setProvider(event.target.value || undefined)
              setSelected(new Set())
            }}
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-slate-600"
          >
            <option value="">All sources</option>
            {syncingProviders.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Checkbox
              checked={showFiled}
              onCheckedChange={(checked) => {
                setShowFiled(checked === true)
                setSelected(new Set())
              }}
            />
            Include filed
          </label>
        </div>
      </div>

      {importing && (
        <div className="flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-sm text-accent-700">
          <Loader2 size={15} className="animate-spin" />
          Still importing from your connected apps. New items appear here as they arrive.
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium text-slate-700">{selectedItems.length} selected</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <FileToProjectMenu
              canUnfile={selectedItems.some((item) => item.projectId)}
              disabled={fileItems.isPending}
              onSelect={(projectId) => file(selectedItems, projectId)}
              trigger={
                <Button type="button" size="sm">
                  <FolderInput size={14} />
                  File to project
                  <ChevronDown size={13} />
                </Button>
              }
            />
          </div>
        </div>
      )}

      {inbox.isLoading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : inbox.isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          The inbox could not be loaded. Try again in a moment.
        </div>
      ) : items.length === 0 ? (
        syncingProviders.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              icon={Inbox}
              title="Nothing connected yet"
              description="Connect Gmail, Outlook, Zoom, Drive, Dropbox or your CRM, and everything they hold will show up here to file into projects."
            />
            <Link
              to="/dashboard/account/integrations"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95"
            >
              Connect an app
            </Link>
          </div>
        ) : (
          <EmptyState
            icon={Inbox}
            title={showFiled ? 'Nothing synced here yet' : 'All filed'}
            description={
              showFiled
                ? 'Items from your connected apps will appear here once they are imported.'
                : 'Everything your connected apps brought in has a project. New items will show up here.'
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
            <span>{items.length} shown</span>
          </div>

          <ul className="divide-y divide-line">
            {items.map((item) => {
              const Icon = KIND_ICON[item.kind]
              const isSelected = selected.has(itemKey(item))
              return (
                <li
                  key={itemKey(item)}
                  className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-accent-50/60' : 'hover:bg-slate-50'}`}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggle(item)} aria-label={`Select ${item.title}`} />
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">{item.title}</span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-slate-400 hover:text-slate-600"
                          aria-label={`Open ${item.title} in ${PROVIDER_NAMES[item.provider] ?? item.provider}`}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">
                        {PROVIDER_NAMES[item.provider] ?? item.provider}
                      </span>
                      {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                    </div>
                  </div>

                  <span className="hidden shrink-0 text-xs tabular-nums text-slate-400 sm:block">
                    {formatWhen(item.occurredAt)}
                  </span>

                  <FileToProjectMenu
                    canUnfile={Boolean(item.projectId)}
                    disabled={fileItems.isPending}
                    onSelect={(projectId) => file([item], projectId)}
                    trigger={
                      <button
                        type="button"
                        className={
                          item.projectId
                            ? 'flex max-w-40 shrink-0 items-center gap-1 truncate rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100'
                            : 'flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50'
                        }
                      >
                        {item.projectId ? (item.projectName ?? 'Filed') : 'File'}
                        <ChevronDown size={12} />
                      </button>
                    }
                  />
                </li>
              )
            })}
          </ul>

          {inbox.hasNextPage && (
            <div className="border-t border-line p-3 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inbox.fetchNextPage()}
                disabled={inbox.isFetchingNextPage}
              >
                {inbox.isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

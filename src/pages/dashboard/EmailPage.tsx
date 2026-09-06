import { useMemo, useState } from 'react'
import {
  Mail,
  Search,
  Plus,
  Inbox,
  Send,
  FileEdit,
  AlertOctagon,
  Trash2,
  Settings,
  Forward,
  CheckCheck,
  Tag,
  Folder as FolderIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import {
  useEmails,
  useMarkEmailsRead,
  useMoveEmailsToFolder,
  useProjects,
  useToggleEmailStar,
} from '../../hooks/useProjectsData'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { MailRow } from '../../components/email/MailRow'
import { ComposeMailModal } from '../../components/email/ComposeMailModal'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import type { Email, EmailFolder } from '../../types/project'
import { showToast } from '../../lib/toast'

const FOLDER_NAV: { value: EmailFolder; label: string; icon: typeof Inbox }[] = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'pending', label: 'Pending Emails', icon: Send },
  { value: 'drafts', label: 'Drafts', icon: FileEdit },
  { value: 'spam', label: 'Spamming', icon: AlertOctagon },
  { value: 'trash', label: 'Trash', icon: Trash2 },
]

type Filter = { type: 'folder'; value: EmailFolder } | { type: 'project'; value: string }

export function EmailPage() {
  const { userProfile } = useAuth()
  const { data: emails = [], isLoading } = useEmails()
  const { data: projects = [] } = useProjects()
  const toggleStar = useToggleEmailStar()
  const markRead = useMarkEmailsRead()
  const moveToFolder = useMoveEmailsToFolder()

  const [filter, setFilter] = useState<Filter>({ type: 'folder', value: 'inbox' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [composeOpen, setComposeOpen] = useState(false)

  const projectById = new Map(projects.map((p) => [p.id, p]))

  const folderCounts = useMemo(() => {
    const counts: Record<EmailFolder, number> = { inbox: 0, pending: 0, drafts: 0, spam: 0, trash: 0 }
    emails.forEach((e) => {
      counts[e.folder] += 1
    })
    return counts
  }, [emails])

  const projectEmailCounts = useMemo(() => {
    const counts = new Map<string, number>()
    emails.forEach((e) => {
      if (!e.projectId) return
      counts.set(e.projectId, (counts.get(e.projectId) ?? 0) + 1)
    })
    return counts
  }, [emails])

  const filteredEmails = emails
    .filter((e) => (filter.type === 'folder' ? e.folder === filter.value : e.projectId === filter.value))
    .filter((e) =>
      searchQuery.trim()
        ? `${e.senderName} ${e.subject} ${e.snippet}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
        : true,
    )
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

  const allSelected = filteredEmails.length > 0 && filteredEmails.every((e) => selectedIds.has(e.id))

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(filteredEmails.map((e) => e.id)))
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function withSelection(action: (ids: string[]) => void) {
    if (selectedIds.size === 0) {
      showToast('info', 'Select at least one email first')
      return
    }
    action([...selectedIds])
    setSelectedIds(new Set())
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar title={`Welcome Back, ${userProfile?.name?.split(' ')[0] ?? 'there'}!`} showUserMeta />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Mail size={20} strokeWidth={1.9} className="text-primary" />
          Mail
        </h1>
        <div className="flex items-center gap-3">
          <label className="flex w-64 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-500">
            <Search size={15} strokeWidth={1.9} className="shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mails"
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            <Plus size={16} strokeWidth={2} />
            New Mail
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[220px]">
          <nav className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <Tabs
              orientation="vertical"
              value={filter.type === 'folder' ? filter.value : undefined}
              onValueChange={(value) => setFilter({ type: 'folder', value: value as EmailFolder })}
            >
              <TabsList className="h-fit w-full flex-col items-stretch gap-1 bg-transparent p-0">
                {FOLDER_NAV.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="w-full justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-600 data-active:bg-primary data-active:text-white data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} strokeWidth={1.9} />
                      {label}
                    </span>
                    {folderCounts[value] > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-xs ${
                          filter.type === 'folder' && filter.value === value
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {folderCounts[value]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <button
              type="button"
              onClick={() => showToast('info', 'Settings aren’t wired up yet')}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Settings size={16} strokeWidth={1.9} />
              Settings
            </button>
          </nav>

          <div className="rounded-2xl border border-line bg-white p-3 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">Labels</p>
            <div className="flex flex-col gap-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setFilter({ type: 'project', value: project.id })}
                  className={`flex items-center justify-between rounded-xl px-2 py-1.5 text-sm transition ${
                    filter.type === 'project' && filter.value === project.id
                      ? 'bg-slate-100 font-medium text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="truncate">{project.name}</span>
                  </span>
                  {(projectEmailCounts.get(project.id) ?? 0) > 0 && (
                    <span className="shrink-0 text-xs text-slate-400">{projectEmailCounts.get(project.id)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white shadow-[0px_10px_40px_10px_rgba(152,150,163,0.16)]">
          <div className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3 text-sm text-slate-500">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
              />
              Select All
            </label>
            <button
              type="button"
              onClick={() => showToast('info', 'Forwarding isn’t wired up yet')}
              className="flex items-center gap-1.5 hover:text-slate-700"
            >
              <Forward size={15} strokeWidth={1.9} />
              Forward
            </button>
            <button
              type="button"
              onClick={() => withSelection((ids) => moveToFolder.mutate({ emailIds: ids, folder: 'spam' }))}
              className="flex items-center gap-1.5 hover:text-slate-700"
            >
              <AlertOctagon size={15} strokeWidth={1.9} />
              Spam
            </button>
            <button
              type="button"
              onClick={() => withSelection((ids) => markRead.mutate(ids))}
              className="flex items-center gap-1.5 hover:text-slate-700"
            >
              <CheckCheck size={15} strokeWidth={1.9} />
              Read
            </button>
            <button
              type="button"
              onClick={() => showToast('info', 'Labeling isn’t wired up yet')}
              className="flex items-center gap-1.5 hover:text-slate-700"
            >
              <Tag size={15} strokeWidth={1.9} />
              Label
            </button>
            <button
              type="button"
              onClick={() => showToast('info', 'Moving folders isn’t wired up yet')}
              className="flex items-center gap-1.5 hover:text-slate-700"
            >
              <FolderIcon size={15} strokeWidth={1.9} />
              Folder
            </button>
          </div>

          <div>
            {isLoading && <p className="px-4 py-10 text-center text-sm text-slate-400">Loading mail…</p>}
            {!isLoading &&
              filteredEmails.map((email: Email) => (
                <MailRow
                  key={email.id}
                  email={email}
                  project={email.projectId ? projectById.get(email.projectId) : undefined}
                  selected={selectedIds.has(email.id)}
                  onToggleSelect={() => toggleSelect(email.id)}
                  onToggleStar={() => toggleStar.mutate(email.id)}
                />
              ))}
            {!isLoading && filteredEmails.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate-400">No mail here.</p>
            )}
          </div>

          <div className="border-t border-line px-4 py-3 text-right text-xs text-slate-400">
            1 – {filteredEmails.length} of {emails.length}
          </div>
        </div>
      </div>

      {composeOpen && <ComposeMailModal onClose={() => setComposeOpen(false)} />}
    </div>
  )
}

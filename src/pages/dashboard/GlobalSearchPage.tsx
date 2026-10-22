import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, FolderKanban, Loader2, Search, StickyNote, Users } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { EmptyState } from '../../components/common/EmptyState'
import { useContacts, useNoteSearch, useProjects } from '../../hooks/useProjectsData'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { PROJECT_STATUS_META } from '../../types/statusMeta'
import { formatShortDate } from '../../lib/formatDate'

interface ResultGroupProps {
  icon: typeof Search
  label: string
  count: number
  children: React.ReactNode
}

function ResultGroup({ icon: Icon, label, count, children }: ResultGroupProps) {
  if (count === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        <Icon size={14} strokeWidth={2} />
        {label}
        <span className="font-normal text-slate-300">({count})</span>
      </h2>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  )
}

const rowClass =
  'flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50/60'

/**
 * Search across projects, tasks, contacts and notes.
 *
 * Projects, tasks and contacts are already cached for the active workspace, so
 * those are matched in the browser. Notes go through the server instead
 * (`/notes/search`), because a note's body and tags are not all loaded up
 * front and matching only what a card shows would quietly miss them.
 */
export function GlobalSearchPage() {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const needle = trimmed.toLowerCase()

  const { data: projects = [] } = useProjects()
  const { data: contacts = [] } = useContacts()
  const { tasks } = useEnrichedTasks()
  const { data: notes = [], isFetching: notesSearching } = useNoteSearch(trimmed)

  const matchedProjects = useMemo(() => {
    if (!needle) return []
    return projects.filter((project) =>
      `${project.name} ${project.tagline} ${project.description} ${project.category} ${project.tags.join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }, [projects, needle])

  const matchedTasks = useMemo(() => {
    if (!needle) return []
    return tasks.filter((task) =>
      `${task.title} ${task.projectName} ${task.tags.join(' ')}`.toLowerCase().includes(needle),
    )
  }, [tasks, needle])

  const matchedContacts = useMemo(() => {
    if (!needle) return []
    return contacts.filter((contact) =>
      `${contact.contactName} ${contact.company} ${contact.email} ${contact.role} ${contact.niche}`
        .toLowerCase()
        .includes(needle),
    )
  }, [contacts, needle])

  const total = matchedProjects.length + matchedTasks.length + matchedContacts.length + notes.length

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Search"
        subtitle="Projects, tasks, contacts and notes, all at once."
        searchPlaceholder="Search everything…"
        searchValue={query}
        onSearchChange={setQuery}
      />

      {!trimmed ? (
        <EmptyState
          icon={Search}
          title="Search across your workspace"
          description="Start typing to find projects, tasks, contacts and notes — including note content and tags."
        />
      ) : total === 0 && !notesSearching ? (
        <EmptyState
          icon={Search}
          title={`Nothing matches “${trimmed}”`}
          description="Try a shorter word, or check which workspace you are in."
        />
      ) : (
        <div className="flex flex-col gap-7">
          {notesSearching && (
            <p className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={13} className="animate-spin" />
              Searching notes…
            </p>
          )}

          <ResultGroup icon={FolderKanban} label="Projects" count={matchedProjects.length}>
            {matchedProjects.map((project) => (
              <Link key={project.id} to={`/dashboard/projects/${project.id}`} className={rowClass}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{project.name}</span>
                  <span className="block truncate text-xs text-slate-400">{project.tagline || project.category}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${PROJECT_STATUS_META[project.status].badgeClass}`}
                >
                  {PROJECT_STATUS_META[project.status].label}
                </span>
              </Link>
            ))}
          </ResultGroup>

          <ResultGroup icon={CheckSquare} label="Tasks" count={matchedTasks.length}>
            {matchedTasks.map((task) => (
              <Link key={task.id} to={`/dashboard/projects/${task.projectId}`} className={rowClass}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.projectColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{task.title}</span>
                  <span className="block truncate text-xs text-slate-400">{task.projectName}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{formatShortDate(task.dueDate)}</span>
              </Link>
            ))}
          </ResultGroup>

          <ResultGroup icon={Users} label="Contacts" count={matchedContacts.length}>
            {matchedContacts.map((contact) => (
              <Link key={contact.id} to="/dashboard/contacts" className={rowClass}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{contact.contactName}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {contact.role ? `${contact.role} · ` : ''}
                    {contact.company || contact.email}
                  </span>
                </span>
              </Link>
            ))}
          </ResultGroup>

          <ResultGroup icon={StickyNote} label="Notes" count={notes.length}>
            {notes.map((note) => (
              <Link key={note.id} to="/dashboard/notes" className={rowClass}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {note.title || 'Untitled note'}
                  </span>
                  <span className="block truncate text-xs text-slate-400">{note.body}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{formatShortDate(note.createdAt)}</span>
              </Link>
            ))}
          </ResultGroup>
        </div>
      )}
    </div>
  )
}

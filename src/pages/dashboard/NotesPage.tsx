import { useMemo, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { NoteCard } from '../../components/notes/NoteCard'
import { NoteFormModal } from '../../components/notes/NoteFormModal'
import { ViewNoteModal } from '../../components/notes/ViewNoteModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useDeleteNote, useNotes, useProjects, useToggleNotePinned } from '../../hooks/useProjectsData'
import { showToast } from '../../lib/toast'
import { CardGridSkeleton } from '../../components/common/skeletons/CardGridSkeleton'
import type { Note } from '../../types/project'

const ALL_PROJECTS = 'All projects'

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes()
  const { data: projects = [] } = useProjects()
  const togglePin = useToggleNotePinned()
  const deleteNote = useDeleteNote()

  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>(ALL_PROJECTS)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [formNote, setFormNote] = useState<Note | 'new' | null>(null)

  const projectNameById = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects])

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return notes.filter((note) => {
      if (projectFilter !== ALL_PROJECTS && note.projectId !== projectFilter) return false
      if (!query) return true
      return `${note.title} ${note.body}`.toLowerCase().includes(query)
    })
  }, [notes, projectFilter, searchQuery])

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const viewingNote = notes.find((n) => n.id === viewingNoteId) ?? null

  async function handleDelete(noteId: string) {
    try {
      await deleteNote.mutateAsync(noteId)
      showToast('success', 'Note deleted')
      setViewingNoteId(null)
    } catch {
      showToast('error', 'Could not delete this note')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <PageHeaderBar
        title="Notes"
        searchPlaceholder="Search notes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">All Notes</h1>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 outline-none hover:bg-slate-50">
              {projectFilter === ALL_PROJECTS ? ALL_PROJECTS : projectNameById.get(projectFilter) ?? ALL_PROJECTS}
              <ChevronDown size={13} strokeWidth={2} className="text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuRadioGroup value={projectFilter} onValueChange={setProjectFilter}>
                <DropdownMenuRadioItem value={ALL_PROJECTS} className="px-2 py-1.5">
                  {ALL_PROJECTS}
                </DropdownMenuRadioItem>
                {projects.map((project) => (
                  <DropdownMenuRadioItem key={project.id} value={project.id} className="px-2 py-1.5">
                    {project.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          type="button"
          onClick={() => setFormNote('new')}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95"
        >
          <Plus size={16} strokeWidth={2} />
          Add Note
        </button>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} withCover={false} className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" />
      ) : sortedNotes.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          {notes.length === 0 ? 'No notes yet — add your first one.' : 'No notes match your filters.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => setViewingNoteId(note.id)}
              onTogglePin={() => togglePin.mutate(note.id)}
            />
          ))}
        </div>
      )}

      {viewingNote && (
        <ViewNoteModal
          note={viewingNote}
          onClose={() => setViewingNoteId(null)}
          onEdit={() => {
            setFormNote(viewingNote)
            setViewingNoteId(null)
          }}
          onDelete={() => handleDelete(viewingNote.id)}
        />
      )}

      {formNote && (
        <NoteFormModal note={formNote === 'new' ? undefined : formNote} onClose={() => setFormNote(null)} />
      )}
    </div>
  )
}

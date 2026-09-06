import { useState } from 'react'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { PageHeaderBar } from '../../components/dashboard/PageHeaderBar'
import { NoteCard } from '../../components/notes/NoteCard'
import { NoteFormModal } from '../../components/notes/NoteFormModal'
import { ViewNoteModal } from '../../components/notes/ViewNoteModal'
import { useDeleteNote, useNotes, useToggleNotePinned } from '../../hooks/useProjectsData'
import { showToast } from '../../lib/toast'
import type { Note } from '../../types/project'

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes()
  const togglePin = useToggleNotePinned()
  const deleteNote = useDeleteNote()

  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [formNote, setFormNote] = useState<Note | 'new' | null>(null)

  const sortedNotes = [...notes].sort((a, b) => {
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
      <PageHeaderBar title="Notes" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">All Notes</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => showToast('info', 'Filtering isn’t wired up yet')}
            aria-label="Filter notes"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-slate-500 hover:bg-slate-50"
          >
            <SlidersHorizontal size={16} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={() => setFormNote('new')}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:brightness-95"
          >
            <Plus size={16} strokeWidth={2} />
            Add Note
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading notes…</p>
      ) : sortedNotes.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No notes yet — add your first one.</p>
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

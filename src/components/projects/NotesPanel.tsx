import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StickyNote } from 'lucide-react'
import { useNotes, useProjects } from '../../hooks/useProjectsData'
import { ViewNoteModal } from '../notes/ViewNoteModal'
import type { Note } from '../../types/project'
import { Card } from '../ui/card'

interface NotesPanelProps {
  projectId?: string
}

export function NotesPanel({ projectId }: NotesPanelProps) {
  const { data: notes = [] } = useNotes()
  const { data: projects = [] } = useProjects()
  const [viewingNote, setViewingNote] = useState<Note | null>(null)

  const visibleNotes = notes
    .filter((note) => !projectId || note.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const projectById = new Map(projects.map((p) => [p.id, p]))

  return (
    <Card className="gap-3 overflow-visible rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] ring-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <StickyNote size={17} strokeWidth={1.9} className="text-primary" />
          Notes ({visibleNotes.length})
        </div>
        <Link to="/dashboard/notes" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
        {visibleNotes.map((note) => {
          const project = note.projectId ? projectById.get(note.projectId) : undefined
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => setViewingNote(note)}
              className="rounded-xl border border-line/70 p-3 text-left hover:border-slate-300 hover:bg-slate-50/60"
            >
              <p className="text-sm font-medium text-slate-900">{note.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{note.excerpt}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {!projectId && project && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </span>
                )}
                {note.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
        {visibleNotes.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No notes yet.</p>}
      </div>

      {viewingNote && (
        <ViewNoteModal
          note={viewingNote}
          projectName={viewingNote.projectId ? projectById.get(viewingNote.projectId)?.name : undefined}
          onClose={() => setViewingNote(null)}
        />
      )}
    </Card>
  )
}

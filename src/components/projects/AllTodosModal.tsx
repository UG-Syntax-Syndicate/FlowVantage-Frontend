import { useState } from 'react'
import { ListTodo } from 'lucide-react'
import { useProjects, useTodos, useToggleTodo } from '../../hooks/useProjectsData'
import { TodoDetailModal } from './TodoDetailModal'
import { formatShortDate } from '../../lib/formatDate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface AllTodosModalProps {
  onClose: () => void
}

export function AllTodosModal({ onClose }: AllTodosModalProps) {
  const { data: todos = [] } = useTodos()
  const { data: projects = [] } = useProjects()
  const toggleTodo = useToggleTodo()
  const [viewingTodoId, setViewingTodoId] = useState<string | null>(null)

  const projectById = new Map(projects.map((p) => [p.id, p]))
  const sorted = [...todos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const viewingTodo = todos.find((t) => t.id === viewingTodoId) ?? null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-line px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ListTodo size={18} strokeWidth={1.9} className="text-primary" />
            All Todos
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No todos yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sorted.map((todo) => {
                const project = todo.projectId ? projectById.get(todo.projectId) : undefined
                return (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 rounded-xl border border-line/70 p-3 hover:bg-slate-50/60"
                  >
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo.mutate(todo.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setViewingTodoId(todo.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={`text-sm ${todo.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {todo.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {project && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                            {project.name}
                          </span>
                        )}
                        {todo.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-400">{formatShortDate(todo.dueDate)}</span>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>

      {viewingTodo && (
        <TodoDetailModal
          todo={viewingTodo}
          projectName={viewingTodo.projectId ? projectById.get(viewingTodo.projectId)?.name : undefined}
          onClose={() => setViewingTodoId(null)}
          onToggleDone={() => toggleTodo.mutate(viewingTodo.id)}
        />
      )}
    </Dialog>
  )
}

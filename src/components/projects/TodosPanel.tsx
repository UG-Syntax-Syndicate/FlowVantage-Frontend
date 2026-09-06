import { useState } from 'react'
import { ListTodo } from 'lucide-react'
import { useProjects, useTodos, useToggleTodo } from '../../hooks/useProjectsData'
import { TodoDetailModal } from './TodoDetailModal'
import { formatShortDate } from '../../lib/formatDate'
import { Card } from '../ui/card'

interface TodosPanelProps {
  projectId?: string
  onViewAll?: () => void
}

export function TodosPanel({ projectId, onViewAll }: TodosPanelProps) {
  const { data: todos = [] } = useTodos()
  const { data: projects = [] } = useProjects()
  const toggleTodo = useToggleTodo()
  const [viewingTodoId, setViewingTodoId] = useState<string | null>(null)
  const viewingTodo = todos.find((t) => t.id === viewingTodoId) ?? null

  const visibleTodos = todos
    .filter((todo) => !projectId || todo.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const projectById = new Map(projects.map((p) => [p.id, p]))

  return (
    <Card className="gap-3 overflow-visible rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] ring-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListTodo size={17} strokeWidth={1.9} className="text-primary" />
          Todos ({visibleTodos.length})
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-xs font-medium text-primary hover:underline">
            View all
          </button>
        )}
      </div>
      <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
        {visibleTodos.map((todo) => {
          const project = todo.projectId ? projectById.get(todo.projectId) : undefined
          return (
            <div
              key={todo.id}
              className="flex items-start gap-2.5 rounded-xl border border-line/70 p-2.5 hover:bg-slate-50/60"
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo.mutate(todo.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40"
              />
              <button type="button" onClick={() => setViewingTodoId(todo.id)} className="min-w-0 flex-1 text-left">
                <p className={`truncate text-sm ${todo.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {todo.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {!projectId && project && (
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
        {visibleTodos.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No todos yet.</p>}
      </div>

      {viewingTodo && (
        <TodoDetailModal
          todo={viewingTodo}
          projectName={viewingTodo.projectId ? projectById.get(viewingTodo.projectId)?.name : undefined}
          onClose={() => setViewingTodoId(null)}
          onToggleDone={() => toggleTodo.mutate(viewingTodo.id)}
        />
      )}
    </Card>
  )
}

import { useState } from 'react'
import { ListChecks, ListTodo } from 'lucide-react'
import { useProjects, useTodos, useToggleTodo, useUpdateTaskStatus } from '../../hooks/useProjectsData'
import { useEnrichedTasks } from '../../hooks/useEnrichedTasks'
import { TodoDetailModal } from './TodoDetailModal'
import { buildTodoListItems } from '../../lib/todoListItems'
import { formatShortDate } from '../../lib/formatDate'
import { PRIORITY_META, TASK_STATUS_ORDER } from '../../types/statusMeta'
import { showToast } from '../../lib/toast'
import { Card } from '../ui/card'

interface TodosPanelProps {
  projectId?: string
  onViewAll?: () => void
}

export function TodosPanel({ projectId, onViewAll }: TodosPanelProps) {
  const { data: todos = [] } = useTodos()
  const { data: projects = [] } = useProjects()
  const { tasks } = useEnrichedTasks()
  const toggleTodo = useToggleTodo()
  const updateTaskStatus = useUpdateTaskStatus()
  const [viewingTodoId, setViewingTodoId] = useState<string | null>(null)

  const items = buildTodoListItems(todos, tasks, projectId)
  const viewingTodo = todos.find((t) => t.id === viewingTodoId) ?? null
  const projectById = new Map(projects.map((p) => [p.id, p]))

  function handleAdvanceTask(taskId: string) {
    const nextStatus = TASK_STATUS_ORDER[TASK_STATUS_ORDER.indexOf('todo') + 1]
    updateTaskStatus.mutate(
      { taskId, status: nextStatus },
      { onSuccess: () => showToast('success', 'Task moved to In Progress') },
    )
  }

  return (
    <Card className="gap-3 overflow-visible rounded-2xl border border-line bg-white p-4 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)] ring-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListTodo size={17} strokeWidth={1.9} className="text-primary" />
          Todos ({items.length})
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-xs font-medium text-primary hover:underline">
            View all
          </button>
        )}
      </div>
      <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto pr-1">
        {items.map((item) => {
          if (item.kind === 'checklist') {
            const { todo } = item
            const project = todo.projectId ? projectById.get(todo.projectId) : undefined
            return (
              <div
                key={item.id}
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
          }

          const { task } = item
          const priority = PRIORITY_META[task.priority]
          return (
            <div
              key={item.id}
              className="flex items-start gap-2.5 rounded-xl border border-line/70 p-2.5 hover:bg-slate-50/60"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => handleAdvanceTask(task.id)}
                title="Mark as started"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/40"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-700">
                  <ListChecks size={12} className="shrink-0 text-slate-400" />
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {!projectId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.projectColor }} />
                      {task.projectName}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priority.badgeClass}`}>
                    {priority.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatShortDate(task.dueDate)}</span>
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No todos yet.</p>}
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

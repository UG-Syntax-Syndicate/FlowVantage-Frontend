import { useState } from 'react'
import { CalendarDays, Check, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar } from '../common/Avatar'
import { AvatarGroup, AvatarGroupCount } from '../ui/avatar'
import { memberColorClass } from '../../lib/memberColor'
import { formatShortDate } from '../../lib/formatDate'
import { showToast } from '../../lib/toast'
import { useUpdateProject } from '../../hooks/useProjectsData'
import type { Project } from '../../types/project'
import type { ProjectMember } from '../../types/workspace'

const MAX_OBJECTIVES = 20

/**
 * Inline editor for the objectives list.
 *
 * Inline rather than a field in EditProjectModal because objectives are the
 * part of the overview people actually revise - reopening a modal that also
 * holds status, priority, tags and dates to reword one line is friction for
 * the most-edited thing on the page.
 */
function ObjectivesEditor({
  projectId,
  initial,
  onDone,
}: {
  projectId: string
  initial: string[]
  onDone: () => void
}) {
  // Always at least one row, so an empty list still offers somewhere to type.
  const [draft, setDraft] = useState<string[]>(initial.length > 0 ? initial : [''])
  const updateProject = useUpdateProject()

  function update(index: number, value: string) {
    setDraft((current) => current.map((item, i) => (i === index ? value : item)))
  }

  async function save() {
    const cleaned = draft.map((item) => item.trim()).filter(Boolean)
    try {
      await updateProject.mutateAsync({ projectId, input: { objectives: cleaned } })
      showToast('success', 'Objectives saved')
      onDone()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Could not save the objectives')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {draft.map((objective, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-xs text-slate-400">{index + 1}.</span>
          <Input
            value={objective}
            onChange={(event) => update(index, event.target.value)}
            placeholder="e.g. Reduce cart abandonment by 20% this quarter"
            maxLength={300}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setDraft((current) => current.filter((_, i) => i !== index))}
            aria-label={`Remove objective ${index + 1}`}
          >
            <Trash2 size={14} strokeWidth={2} />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={draft.length >= MAX_OBJECTIVES}
          onClick={() => setDraft((current) => [...current, ''])}
        >
          <Plus size={14} strokeWidth={2} />
          Add objective
        </Button>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            loading={updateProject.isPending}
            disabled={updateProject.isPending}
          >
            <Check size={14} strokeWidth={2} />
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ProjectOverviewCardProps {
  project: Project
  members: ProjectMember[]
  ownerName: string
  canManage: boolean
  onEdit: () => void
}

export function ProjectOverviewCard({
  project,
  members,
  ownerName,
  canManage,
  onEdit,
}: ProjectOverviewCardProps) {
  const [editingObjectives, setEditingObjectives] = useState(false)

  const visible = members.slice(0, 5)
  const overflow = members.length - visible.length

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6 shadow-[0px_10px_32px_4px_rgba(152,150,163,0.12)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Project Owner : <span className="font-medium text-slate-900">{ownerName}</span>
        </p>

        <div className="flex items-center gap-3">
          <AvatarGroup>
            {visible.map((member) => (
              <Avatar
                key={member.userId}
                photoURL={member.photoURL}
                name={member.name}
                size={28}
                bgClassName={memberColorClass(member.userId)}
              />
            ))}
            {overflow > 0 && (
              <AvatarGroupCount style={{ width: 28, height: 28 }} className="text-xs font-medium">
                +{overflow}
              </AvatarGroupCount>
            )}
          </AvatarGroup>

          <span className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slate-600">
            <CalendarDays size={14} strokeWidth={2} className="text-slate-400" />
            {formatShortDate(project.startDate)} – {formatShortDate(project.dueDate)}
          </span>

          {canManage && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit project"
              className="rounded-lg border border-line p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Description :</h2>
        {project.description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{project.description}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            No description yet.{' '}
            {canManage && (
              <button type="button" onClick={onEdit} className="text-primary hover:underline">
                Add one
              </button>
            )}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Key Objectives :</h2>
          {canManage && !editingObjectives && (
            <button
              type="button"
              onClick={() => setEditingObjectives(true)}
              aria-label="Edit key objectives"
              className="rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
            >
              <Pencil size={12} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <div className="mt-2">
          {editingObjectives ? (
            <ObjectivesEditor
              projectId={project.id}
              initial={project.objectives}
              onDone={() => setEditingObjectives(false)}
            />
          ) : project.objectives.length > 0 ? (
            <ol className="flex list-inside list-decimal flex-col gap-1.5 text-sm leading-relaxed text-slate-600">
              {project.objectives.map((objective, index) => (
                <li key={`${index}-${objective}`}>{objective}</li>
              ))}
            </ol>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
              <ListChecks size={16} strokeWidth={1.9} className="shrink-0 text-slate-300" aria-hidden="true" />
              <p className="text-sm text-slate-500">
                No objectives set.{' '}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setEditingObjectives(true)}
                    className="font-medium text-primary hover:underline"
                  >
                    Add what this project is for
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

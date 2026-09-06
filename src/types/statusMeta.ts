import type { ContactStage, ContactStatus, Priority, ProjectStatus, TaskStatus } from './project'

interface StatusMeta {
  label: string
  badgeClass: string
  dotClass: string
}

/**
 * Single source of truth for how a TaskStatus renders anywhere in the app
 * (list rows, board columns, calendar chips, gantt bars). Never inline a
 * status -> label/color mapping in a component - extend this map instead.
 */
export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  todo: { label: 'To Do', badgeClass: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400' },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  in_review: {
    label: 'In Review',
    badgeClass: 'bg-sky-50 text-sky-700',
    dotClass: 'bg-sky-500',
  },
  done: {
    label: 'Done',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
}

export const TASK_STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']

export const PROJECT_STATUS_META: Record<ProjectStatus, StatusMeta> = {
  planning: {
    label: 'Planning',
    badgeClass: 'bg-violet-50 text-violet-700',
    dotClass: 'bg-violet-500',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  on_hold: { label: 'On Hold', badgeClass: 'bg-slate-100 text-slate-600', dotClass: 'bg-slate-400' },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
}

export const PRIORITY_META: Record<Priority, StatusMeta> = {
  low: { label: 'Low', badgeClass: 'bg-slate-100 text-slate-500', dotClass: 'bg-slate-400' },
  medium: { label: 'Medium', badgeClass: 'bg-sky-50 text-sky-700', dotClass: 'bg-sky-500' },
  high: { label: 'High', badgeClass: 'bg-orange-50 text-orange-700', dotClass: 'bg-orange-500' },
  urgent: { label: 'Urgent', badgeClass: 'bg-rose-50 text-rose-700', dotClass: 'bg-rose-500' },
}

export const CONTACT_STATUS_META: Record<ContactStatus, StatusMeta> = {
  new_client: { label: 'New client', badgeClass: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500' },
  potential_client: { label: 'Potential client', badgeClass: 'bg-amber-50 text-amber-700', dotClass: 'bg-amber-500' },
  old_client: { label: 'Old client', badgeClass: 'bg-violet-50 text-violet-700', dotClass: 'bg-violet-500' },
  blacklist: { label: 'Blacklist', badgeClass: 'bg-rose-50 text-rose-700', dotClass: 'bg-rose-500' },
}

export const CONTACT_STAGE_META: Record<ContactStage, StatusMeta> = {
  in_progress: { label: 'In progress', badgeClass: 'bg-sky-50 text-sky-700', dotClass: 'bg-sky-500' },
  proposal_sent: { label: 'Proposal sent', badgeClass: 'bg-teal-50 text-teal-700', dotClass: 'bg-teal-500' },
  completed: { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-700', dotClass: 'bg-emerald-500' },
  rejected: { label: 'Rejected', badgeClass: 'bg-rose-50 text-rose-700', dotClass: 'bg-rose-500' },
}

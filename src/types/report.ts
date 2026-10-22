/**
 * The shape of GET /reporting/projects/:id/report-data - the same data the PDF
 * and DOCX renderers consume server-side.
 *
 * Deliberately mirrors the backend's row shapes (snake_case) rather than being
 * camelCased on the way in. The point of this endpoint is that the in-app
 * preview and the downloaded document come from one source and so cannot
 * disagree; remapping it here would add a second place for the two to drift.
 */

export interface ReportSummary {
  status: string
  client: string
  startDate: string
  dueDate: string
  taskCount: number
  tasksDone: number
  taskCompletion: number
  todoCount: number
  todosDone: number
  todoCompletion: number
  documentCount: number
  noteCount: number
  memberCount: number
  trackedTime: string
  inventoryCostFormatted: string
  inventoryCostMinor: number
  overdueTasks: number
}

export interface ReportTask {
  id: string
  title: string
  status: string
  priority: string | null
  due_date: string | null
  assignee_name: string | null
}

export interface ReportTodo {
  id: string
  title: string
  done: number
}

export interface ReportDocument {
  name: string
  mime_type: string | null
  size: number | null
  created_at: string
  uploader_name: string | null
}

export interface ReportNote {
  title: string | null
  content: string | null
  created_at: string
  author_name: string | null
}

export interface ReportConsumptionLine {
  item_id: string
  item_name: string
  sku: string | null
  unit: string
  currency: string
  quantity_consumed: string | number
  cost_minor: string | number
}

export interface ReportAllocation {
  id: string
  item_name: string
  unit: string
  quantity: string | number
  status: string
}

export interface ReportMilestone {
  title: string
  start_time: string
  end_time: string | null
  location: string | null
}

export interface ReportActivityEntry {
  occurred_at: string
  action: string
  resource_type: string | null
  actor_email: string | null
}

export interface ReportMember {
  id: string
  display_name: string | null
  email: string | null
  role: string | null
}

export interface ProjectReportData {
  generatedAt: string
  project: { id: string; name: string; description: string | null; status: string }
  members: ReportMember[]
  summary: ReportSummary
  tasks: ReportTask[]
  todos: ReportTodo[]
  documents: ReportDocument[]
  notes: ReportNote[]
  inventory: {
    consumption: ReportConsumptionLine[]
    allocations: ReportAllocation[]
    totalMinor: number
    currency: string
  }
  milestones: ReportMilestone[]
  activity: ReportActivityEntry[]
}

export type ReportFormat = 'pdf' | 'docx'

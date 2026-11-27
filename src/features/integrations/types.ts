/** Wire types for the backend's /integrations/inbox and filing endpoints. */

export type InboxKind = 'email' | 'event' | 'contact' | 'file' | 'record'

export interface InboxItem {
  kind: InboxKind
  id: string
  provider: string
  title: string
  subtitle: string | null
  occurredAt: string | null
  /** A link out to the provider (file, meeting), when there is one. */
  url: string | null
  projectId: string | null
  projectName: string | null
}

export interface InboxPage {
  items: InboxItem[]
  nextCursor: string | null
  /** Unfiled counts per kind, for the tab badges. */
  unfiled: Record<InboxKind, number>
}

export interface InboxFilters {
  kind: InboxKind | 'all'
  provider?: string
  /** false: only unfiled (the default view); 'any': everything. */
  filed: 'false' | 'true' | 'any'
  projectId?: string
}

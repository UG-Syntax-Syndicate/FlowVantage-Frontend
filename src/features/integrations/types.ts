import type { components } from '../../types/api.gen'

/**
 * Wire types for the backend's /integrations/inbox and filing endpoints,
 * generated from its zod schemas (src/types/api.gen.ts, `npm run gen:api`).
 * Only the client-side view types below are written by hand.
 */

type Schemas = components['schemas']

export type InboxKind = Schemas['InboxKind']
export type InboxItem = Schemas['InboxItem']
export type FileItemsRequest = Schemas['FileItemsRequest']

/** One page of the inbox, as the hooks hand it to components. */
export interface InboxPage {
  items: InboxItem[]
  nextCursor: string | null
  /** Unfiled counts per kind, for the tab badges. */
  unfiled: Schemas['InboxResponse']['unfiled']
}

export interface InboxFilters {
  kind: InboxKind | 'all'
  provider?: string
  /** 'false': only unfiled (the default view); 'any': everything. */
  filed: NonNullable<Schemas['InboxQuery']['filed']>
  projectId?: string
}

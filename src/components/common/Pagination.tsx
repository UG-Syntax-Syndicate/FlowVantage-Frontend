import { ChevronLeft, ChevronRight } from 'lucide-react'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

/**
 * Page numbers with ellipses, e.g. 1 2 … 7 8 9 … 24 25.
 *
 * Always keeps the first two, the last two and the window around the current
 * page, so the control's width stays stable as the page moves - a list that
 * reflows its own pagination while being clicked is hard to use.
 */
export function buildPageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('ellipsis')
    result.push(page)
    previous = page
  }
  return result
}

interface PaginationProps {
  page: number
  totalPages: number
  pageSize: PageSize
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
}

/**
 * Extracted from ContactsPage, which hand-rolled this; Inventory needs the
 * same control and a second copy is how the two drift apart.
 *
 * The caller owns `page` and clamps it, because it is the caller that knows
 * when a filter change should reset to page 1.
 */
export function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  const pageList = buildPageList(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
      <div className="flex items-center gap-1.5">
        {PAGE_SIZE_OPTIONS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onPageSizeChange(size)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              pageSize === size ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {size} rows
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        {pageList.map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium ${
                entry === page ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

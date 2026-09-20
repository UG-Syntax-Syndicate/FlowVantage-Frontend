import { Skeleton } from '../../ui/skeleton'

interface ListRowsSkeletonProps {
  count?: number
  withAvatar?: boolean
  className?: string
}

/** Rows of avatar + two-line placeholders, for notes/documents/email/task lists while loading. */
export function ListRowsSkeleton({ count = 4, withAvatar = false, className }: ListRowsSkeletonProps) {
  return (
    <div className={className ?? 'flex flex-col gap-3'}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
          {withAvatar && <Skeleton className="h-9 w-9 shrink-0 rounded-full" />}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

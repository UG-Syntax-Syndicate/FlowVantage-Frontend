import { Skeleton } from '../../ui/skeleton'

interface CardGridSkeletonProps {
  count?: number
  /** Matches ProjectCard's ~112px cover; NoteCard-style cards look fine without it. */
  withCover?: boolean
  className?: string
}

/** Grid of card-shaped placeholders for project/note/folder grids while their query is loading. */
export function CardGridSkeleton({ count = 6, withCover = true, className }: CardGridSkeletonProps) {
  return (
    <div className={className ?? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
          {withCover && <Skeleton className="h-28 w-full rounded-none" />}
          <div className="flex flex-col gap-2.5 p-4 pt-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

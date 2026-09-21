import { Skeleton } from '../../ui/skeleton'
import { TableCell, TableRow } from '../../ui/table'

interface TableRowsSkeletonProps {
  rows?: number
  columns?: number
}

/** `<TableRow>` placeholders for a shadcn `<Table>`'s `<TableBody>` while its query is loading. */
export function TableRowsSkeleton({ rows = 6, columns = 7 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r} className="hover:bg-transparent">
          {Array.from({ length: columns }, (_, c) => (
            <TableCell key={c}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

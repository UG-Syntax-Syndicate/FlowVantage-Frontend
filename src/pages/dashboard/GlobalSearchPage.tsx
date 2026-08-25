import { Search } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function GlobalSearchPage() {
  return (
    <EmptyState
      icon={Search}
      title="Global search is coming soon"
      description="Search across projects, contacts, notes, and linked emails from one place."
    />
  )
}

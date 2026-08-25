import { StickyNote } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function NotesPage() {
  return (
    <EmptyState
      icon={StickyNote}
      title="Notes are coming soon"
      description="Free-text notes attached to projects and contacts will appear here. This module isn't built yet."
    />
  )
}

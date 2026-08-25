import { FolderKanban } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function ProjectsPage() {
  return (
    <EmptyState
      icon={FolderKanban}
      title="Projects are coming soon"
      description="Track projects, tasks, and timelines in one place. This module isn't built yet."
    />
  )
}

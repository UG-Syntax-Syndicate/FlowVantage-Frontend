import { Users } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function ContactsPage() {
  return (
    <EmptyState
      icon={Users}
      title="Contacts are coming soon"
      description="Centralize client, vendor, and partner contacts here. This module isn't built yet."
    />
  )
}

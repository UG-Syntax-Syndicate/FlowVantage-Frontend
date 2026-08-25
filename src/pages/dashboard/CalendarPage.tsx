import { CalendarDays } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function CalendarPage() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Calendar is coming soon"
      description="Two-way sync with Google Calendar and Outlook will appear here. This module isn't built yet."
    />
  )
}

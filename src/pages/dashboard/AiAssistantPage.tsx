import { Sparkles } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function AiAssistantPage() {
  return (
    <EmptyState
      icon={Sparkles}
      title="AI Assistant is coming soon"
      description="Daily summaries, reminders, and natural-language answers about your work will appear here."
    />
  )
}

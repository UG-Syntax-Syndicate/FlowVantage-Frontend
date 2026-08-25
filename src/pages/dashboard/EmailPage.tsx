import { Mail } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'

export function EmailPage() {
  return (
    <EmptyState
      icon={Mail}
      title="Email is coming soon"
      description="Connected Outlook and Gmail threads will appear here, matched to your projects and contacts."
    />
  )
}

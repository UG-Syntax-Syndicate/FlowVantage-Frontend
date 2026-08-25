import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { EmptyState } from '../../components/common/EmptyState'

export function DashboardHome() {
  const { userProfile } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-xl font-semibold text-slate-900">
          Welcome{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-slate-500">Here&apos;s your workspace overview.</p>
      </div>
      <EmptyState
        icon={LayoutDashboard}
        title="Your dashboard is warming up"
        description="Project status, calendar events, and AI suggestions will appear here once those modules launch."
      />
    </div>
  )
}

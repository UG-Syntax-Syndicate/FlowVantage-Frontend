import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mx-auto max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  variant: 'primary' | 'default'
  shadowClass: string
}

export function StatCard({ icon: Icon, label, value, variant, shadowClass }: StatCardProps) {
  const isPrimary = variant === 'primary'

  return (
    <div
      className={`flex h-[151px] flex-1 min-w-[220px] flex-col justify-between gap-4 rounded-2xl border p-5 ${shadowClass} ${
        isPrimary ? 'border-transparent bg-primary text-white' : 'border-line bg-white text-slate-900'
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isPrimary ? 'bg-white/20' : 'bg-accent-50 text-primary'
        }`}
      >
        <Icon size={20} strokeWidth={1.9} />
      </div>
      <div>
        <p className={`text-3xl font-semibold ${isPrimary ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-sm ${isPrimary ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      </div>
    </div>
  )
}

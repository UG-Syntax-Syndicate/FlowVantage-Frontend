interface LogoBadgeProps {
  className?: string
}

export function LogoBadge({ className = '' }: LogoBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-orange-50/95 py-1.5 pl-1.5 pr-4 shadow-lg shadow-slate-900/10 ${className}`}
    >
      <img src="/flow-vantage-logo2.png" alt="" className="h-7 w-7" />
      <span className="font-mono text-base font-medium tracking-tight text-slate-900">flowvantage</span>
    </div>
  )
}

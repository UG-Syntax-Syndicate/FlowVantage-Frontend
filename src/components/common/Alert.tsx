import type { ReactNode } from 'react'

interface AlertProps {
  variant: 'error' | 'success' | 'info'
  children: ReactNode
}

const VARIANT_CLASSES: Record<AlertProps['variant'], string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-accent-200 bg-accent-50 text-accent-700',
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${VARIANT_CLASSES[variant]}`}>
      {children}
    </div>
  )
}

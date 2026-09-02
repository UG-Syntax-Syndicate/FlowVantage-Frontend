import type { ReactNode } from 'react'

interface ModalShellProps {
  children: ReactNode
  onBackdropClick?: () => void
  panelClassName?: string
}

export function ModalShell({ children, onBackdropClick, panelClassName = 'max-w-sm' }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      {onBackdropClick && (
        <button
          type="button"
          aria-label="Close"
          onClick={onBackdropClick}
          className="absolute inset-0 cursor-default"
        />
      )}
      <div className={`relative w-full rounded-2xl bg-white p-6 shadow-xl ${panelClassName}`}>{children}</div>
    </div>
  )
}

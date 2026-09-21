import { motion } from 'motion/react'

interface BrandedLoadingOverlayProps {
  message?: string
}

/**
 * Centered, animated FlowVantage mark over a light blurred backdrop.
 * `absolute inset-0` so it overlays whatever shell/backdrop the parent
 * already renders behind it - the parent stays responsible for showing the
 * "target page" underneath, never a blank white screen. The parent must be
 * (or contain) a `position: relative` ancestor for this to anchor correctly.
 */
export function BrandedLoadingOverlay({ message }: BrandedLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-sm">
      <motion.img
        src="/flow-vantage-logo.png"
        alt="FlowVantage"
        className="h-16 w-16 drop-shadow-lg"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  )
}

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { LogoBadge } from '../components/auth/LogoBadge'
import { NotFoundIllustration } from '../components/common/NotFoundIllustration'
import { useAuth } from '../hooks/useAuth'
import { EASE_PREMIUM } from '../lib/motion'

export function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const reduceMotion = useReducedMotion()

  // This route sits outside DashboardLayout, so it replaces the whole shell -
  // which means it has to offer its own way back. "Go back" is the one that
  // matters when a stale in-app link lands here; the primary action is the
  // fallback for a bookmarked or mistyped URL, where history has nothing
  // useful behind it.
  const canGoBack = location.key !== 'default'
  const homePath = currentUser ? '/dashboard' : '/'

  return (
    <div className="flex min-h-screen flex-col bg-surface px-4 py-8 sm:px-6">
      <Link to={homePath} className="self-start rounded-full" aria-label="FlowVantage home">
        <LogoBadge />
      </Link>

      <motion.main
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
        className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 text-center"
      >
        <NotFoundIllustration className="h-auto w-full max-w-lg" />

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
            This page doesn&apos;t exist
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
            The link may be broken, or the page may have moved. Nothing you were working on has been
            lost.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
          {canGoBack && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft aria-hidden="true" />
              Go back
            </Button>
          )}
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to={homePath}>{currentUser ? 'Go to dashboard' : 'Go to sign in'}</Link>
          </Button>
        </div>
      </motion.main>
    </div>
  )
}

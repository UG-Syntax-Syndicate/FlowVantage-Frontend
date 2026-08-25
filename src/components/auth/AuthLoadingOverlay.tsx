import { Link } from 'react-router-dom'
import { AuthHeroPanel } from './AuthHeroPanel'
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout'

export function AuthLoadingOverlay() {
  const timedOut = useLoadingTimeout(true)

  return (
    <main className="h-dvh bg-white p-0 sm:p-4 lg:p-8">
      <section className="relative mx-auto grid h-full max-w-6xl overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl sm:shadow-slate-200/60 lg:grid-cols-2">
        <AuthHeroPanel mobileVisible />
        <div className="hidden bg-white lg:block" />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm">
          {timedOut ? (
            <div className="mx-4 w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-lg">
              <p className="text-sm font-medium text-slate-900">This is taking longer than expected</p>
              <p className="mt-1 text-sm text-slate-500">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 w-full rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600"
              >
                Reload
              </button>
              <Link
                to="/login"
                className="mt-2 block text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <div className="rounded-full bg-white/90 p-3 shadow-lg">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-100 border-t-accent-500" />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

import { Link } from 'react-router-dom'
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout'

export function DashboardLoadingScreen() {
  const timedOut = useLoadingTimeout(true)

  return (
    <div className="flex h-screen w-full bg-white">
      <div className="hidden w-[64px] shrink-0 bg-rail lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-16 shrink-0 border-b border-slate-100" />
        <div className="flex flex-1 items-center justify-center">
          {timedOut ? (
            <div className="mx-4 w-full max-w-xs rounded-2xl border border-slate-200 p-5 text-center shadow-lg">
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
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-100 border-t-accent-500" />
          )}
        </div>
      </div>
    </div>
  )
}

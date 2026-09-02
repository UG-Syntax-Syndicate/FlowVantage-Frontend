import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AuthHeroPanel } from './AuthHeroPanel'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex h-dvh w-full overflow-hidden bg-white">
      <div className="flex h-full min-h-0 w-full items-center justify-center overflow-y-auto p-5 sm:p-8 lg:w-1/2 lg:p-10">
        <div className="flex h-full max-h-full w-full max-w-md flex-col justify-between">
          <Link to="/" className="mb-6 lg:hidden">
            <img src="/flow-vantage-logo2.png" alt="Flow Vantage" className="h-9 w-9" />
          </Link>
          <div className="mx-auto flex w-full flex-1 flex-col justify-center">{children}</div>
          <p className="mt-10 text-center text-xs text-slate-400">© 2026 ALL RIGHTS RESERVED</p>
        </div>
      </div>

      <div className="hidden h-full min-h-0 p-4 sm:p-6 lg:block lg:w-1/2 lg:p-8">
        <div className="h-full min-h-0 overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/10">
          <AuthHeroPanel />
        </div>
      </div>
    </main>
  )
}

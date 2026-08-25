import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AuthHeroPanel } from './AuthHeroPanel'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="h-dvh bg-white p-0 sm:p-4 lg:p-8">
      <section className="mx-auto grid h-full max-w-6xl overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-2xl sm:shadow-slate-200/60 lg:grid-cols-2">
        <AuthHeroPanel />

        <div className="overflow-y-auto p-5 sm:p-10">
          <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-md space-y-6">
              <Link to="/" className="lg:hidden">
                <img src="/flow-Vantage-logo.jpeg" alt="Flow Vantage" className="h-9 w-auto rounded-md" />
              </Link>
              {children}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

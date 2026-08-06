import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from './firebase'

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword'

function App() {
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const resetFeedback = () => {
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()
    setLoading(true)

    try {
      if (mode === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password)
        setMessage('Signed in successfully.')
      } else if (mode === 'signUp') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        await createUserWithEmailAndPassword(auth, email, password)
        setMessage('Account created successfully.')
      } else {
        await sendPasswordResetEmail(auth, email)
        setMessage('Password reset email sent.')
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const title =
    mode === 'signIn'
      ? 'Sign in to FlowVantage'
      : mode === 'signUp'
        ? 'Create your account'
        : 'Reset your password'

  return (
    <main className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30 lg:grid-cols-2">
        <div className="relative hidden bg-slate-900 lg:block">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
            alt="Project planning workspace"
            className="h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/80 via-slate-900/70 to-cyan-900/55" />
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">
              FlowVantage AI
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              One workspace for projects, people, and communication.
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-white/10 bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signIn')
                    resetFeedback()
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === 'signIn'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signUp')
                    resetFeedback()
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === 'signUp'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign up
                </button>
              </div>
              <h2 className="text-3xl font-semibold text-white">{title}</h2>
              <p className="text-sm text-slate-400">
                Manage your projects from one secure, centralized workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                  placeholder="you@company.com"
                />
              </div>

              {mode !== 'forgotPassword' && (
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {mode === 'signUp' && (
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-slate-200"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-slate-800 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'signIn'
                    ? 'Sign in'
                    : mode === 'signUp'
                      ? 'Create account'
                      : 'Send reset link'}
              </button>

              {mode === 'signIn' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgotPassword')
                    resetFeedback()
                  }}
                  className="w-full text-sm text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot your password?
                </button>
              )}

              {mode === 'forgotPassword' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signIn')
                    resetFeedback()
                  }}
                  className="w-full text-sm text-cyan-300 transition hover:text-cyan-200"
                >
                  Back to sign in
                </button>
              )}
            </form>

            {error && (
              <p className="rounded-xl border border-rose-400/30 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl border border-emerald-400/30 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
                {message}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App

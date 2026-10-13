import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { reportError } from '../../lib/observability'
import { Button } from '../ui/button'

interface Props {
  children: ReactNode
  /** Names the subtree, so a report says which part of the app threw. */
  boundary: string
  /** Replaces the default panel, for a boundary inside an existing layout. */
  fallback?: (reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors and shows something recoverable instead of a blank
 * page.
 *
 * The app had no boundary of any kind - no ErrorBoundary, no componentDidCatch,
 * no router errorElement - so a single throw during render unmounted the whole
 * tree and left an empty white #root with nothing in the UI to act on and
 * nothing reported anywhere. `useWorkspace()` throws by design when its context
 * is missing, which made that one mistake enough to white-screen the app.
 *
 * Deliberately a class component: error boundaries have no hook equivalent.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, {
      source: 'react.errorBoundary',
      boundary: this.props.boundary,
      componentStack: info.componentStack,
    })
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.fallback) return this.props.fallback(this.reset)

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle size={36} strokeWidth={1.7} className="text-amber-500" />
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium text-slate-800">Something went wrong</p>
          <p className="max-w-sm text-sm text-slate-500">
            This part of the app failed to load. Trying again often clears it — if it keeps happening, reloading the
            page will.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={this.reset}>
            <RefreshCw size={15} strokeWidth={2} />
            Try again
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
        {import.meta.env.DEV && (
          <pre className="max-w-full overflow-x-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-600">
            {error.message}
          </pre>
        )}
      </div>
    )
  }
}

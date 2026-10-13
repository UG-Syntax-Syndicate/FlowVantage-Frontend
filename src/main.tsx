import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider'
import { WorkspaceProvider } from './context/WorkspaceProvider'
import { SplashScreen } from './components/splash/SplashScreen'
import { queryClient } from './lib/queryClient'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'
import { initObservability } from './lib/observability'

// Before anything renders, so a failure during the first paint is still
// reported. No-ops when VITE_SENTRY_DSN is unset.
initObservability()

function Root() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            {/*
              Inside the providers, not outside: a boundary above AuthProvider
              would unmount the auth state it is trying to recover from, and
              most render failures here are a page's, not the shell's. App's own
              Suspense fallbacks sit below this.
            */}
            <AppErrorBoundary boundary="app">
              <App />
            </AppErrorBoundary>
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: '!rounded-xl !border !border-slate-200 !bg-white !text-slate-900 !text-sm !shadow-lg',
                  description: '!text-slate-500',
                },
              }}
            />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

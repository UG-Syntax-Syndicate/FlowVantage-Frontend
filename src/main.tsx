import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider'
import { SplashScreen } from './components/splash/SplashScreen'

function Root() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <BrowserRouter>
      <AuthProvider>
        {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: '!rounded-xl !border !border-slate-200 !bg-white !text-slate-900 !text-sm !shadow-lg',
              description: '!text-slate-500',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

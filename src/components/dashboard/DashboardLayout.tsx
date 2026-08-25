import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import { useAuth } from '../../hooks/useAuth'
import { Alert } from '../common/Alert'
import { IconRail } from './IconRail'
import { TopBar } from './TopBar'
import { MobileNavDrawer } from './MobileNavDrawer'

export function DashboardLayout() {
  useSessionTimeout()
  const { currentUser } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-white">
      <IconRail />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        {currentUser && !currentUser.emailVerified && (
          <div className="px-4 pt-4 sm:px-6">
            <Alert variant="info">
              Please verify your email address. Check your inbox, or{' '}
              <a href="/verify-email-pending" className="font-medium underline">
                resend the verification link
              </a>
              .
            </Alert>
          </div>
        )}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

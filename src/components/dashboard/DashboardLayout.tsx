import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import { IconRail } from './IconRail'
import { TopBar } from './TopBar'
import { MobileNavDrawer } from './MobileNavDrawer'
import { EmailVerificationGateModal } from './EmailVerificationGateModal'

export function DashboardLayout() {
  useSessionTimeout()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-white">
      <EmailVerificationGateModal />
      <IconRail />
      <MobileNavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

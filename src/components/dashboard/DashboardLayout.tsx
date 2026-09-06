import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useSessionTimeout } from '../../hooks/useSessionTimeout'
import { Sidebar } from './Sidebar'
import { EmailVerificationGateModal } from './EmailVerificationGateModal'
import { TwoFactorChallengeModal } from './TwoFactorChallengeModal'
import { SessionWarningModal } from './SessionWarningModal'
import { SessionExpiredScreen } from './SessionExpiredScreen'
import { SidebarProvider, useSidebar } from '../animate-ui/components/radix/sidebar'

function MobileHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={toggleSidebar}
        title="Open menu"
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <Menu size={20} strokeWidth={1.9} />
      </button>
      <img src="/flow-vantage-logo2.png" alt="Flow Vantage" className="h-7 w-7" />
    </header>
  )
}

export function DashboardLayout() {
  const { phase, secondsRemaining, stayActive } = useSessionTimeout()
  const { twoFactorChallenge, sessionExpired } = useAuth()

  let gateModal: React.ReactNode = <EmailVerificationGateModal />
  if (sessionExpired) {
    gateModal = <SessionExpiredScreen />
  } else if (twoFactorChallenge) {
    gateModal = <TwoFactorChallengeModal />
  } else if (phase === 'warning') {
    gateModal = <SessionWarningModal secondsRemaining={secondsRemaining} onStayActive={stayActive} />
  }

  return (
    <SidebarProvider
      className="h-screen w-full bg-surface"
      style={{ '--sidebar-width': '257px' } as React.CSSProperties}
    >
      {gateModal}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  )
}

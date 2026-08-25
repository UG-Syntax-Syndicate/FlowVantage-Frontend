import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { X, Settings, LogOut } from 'lucide-react'
import { NAV_ITEMS } from './navItems'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { Avatar } from '../common/Avatar'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-rail transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <img src="/flow-Vantage-logo.jpeg" alt="Flow Vantage" className="h-8 w-auto rounded-md" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rail-hover hover:text-white"
          >
            <X size={20} strokeWidth={1.9} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-accent-500 text-white'
                    : 'text-slate-300 hover:bg-rail-hover hover:text-white'
                }`
              }
            >
              <item.icon size={19} strokeWidth={1.9} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar photoURL={userProfile?.photoURL} name={userProfile?.name ?? currentUser?.email} size={32} ringed />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {userProfile?.name ?? currentUser?.displayName ?? 'Account'}
              </p>
              <p className="truncate text-xs text-slate-400">{currentUser?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/dashboard/account')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-rail-hover hover:text-white"
          >
            <Settings size={19} strokeWidth={1.9} />
            Account settings
          </button>
          <button
            type="button"
            onClick={async () => {
              if (loggingOut) return
              setLoggingOut(true)
              onClose()
              try {
                await logout()
              } finally {
                setLoggingOut(false)
              }
            }}
            disabled={loggingOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rail-hover hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={19} strokeWidth={1.9} />
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  )
}

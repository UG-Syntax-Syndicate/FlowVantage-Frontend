import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { Avatar } from '../common/Avatar'

export function UserMenu() {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Account"
        aria-label="Account menu"
      >
        <Avatar photoURL={userProfile?.photoURL} name={userProfile?.name ?? currentUser?.email} size={36} ringed />
      </button>

      {open && (
        <div className="absolute bottom-0 left-full ml-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
          <div className="border-b border-slate-100 px-3.5 py-2.5">
            <p className="truncate text-sm font-medium text-slate-900">
              {userProfile?.name ?? currentUser?.displayName ?? 'Account'}
            </p>
            <p className="truncate text-xs text-slate-500">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              navigate('/dashboard/account')
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings size={16} strokeWidth={1.9} />
            Account settings
          </button>
          <button
            type="button"
            onClick={async () => {
              if (loggingOut) return
              setLoggingOut(true)
              setOpen(false)
              try {
                await logout()
              } finally {
                setLoggingOut(false)
              }
            }}
            disabled={loggingOut}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} strokeWidth={1.9} />
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  )
}

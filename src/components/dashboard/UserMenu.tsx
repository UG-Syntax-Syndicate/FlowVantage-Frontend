import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { Avatar } from '../common/Avatar'
import { getUserAvatarUrl } from '../../lib/avatars'
import { cn } from '../../lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface UserMenuProps {
  /** Full trigger content (e.g. avatar + name/plan). Defaults to just the avatar. */
  children?: ReactNode
  triggerClassName?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export function UserMenu({ children, triggerClassName, side = 'right', align = 'end' }: UserMenuProps) {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <DropdownMenu>
      {/* `asChild` renders our own button as the trigger, so the entire
          content passed in (not just the avatar image) is the clickable
          hit-area that opens the dropdown. */}
      <DropdownMenuTrigger asChild title="Account" aria-label="Account menu">
        <button
          type="button"
          className={cn(
            'flex min-w-0 cursor-pointer items-center gap-2.5 rounded-[10px] text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
            triggerClassName,
          )}
        >
          {children ?? (
            <Avatar
              photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? currentUser?.uid ?? currentUser?.email ?? 'user')}
              name={userProfile?.name ?? currentUser?.email}
              size={36}
              ringed
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-52 p-1.5">
        <DropdownMenuLabel className="px-2 py-2">
          <p className="truncate text-sm font-medium text-slate-900">
            {userProfile?.name ?? currentUser?.displayName ?? 'Account'}
          </p>
          <p className="truncate text-xs font-normal text-slate-500">{currentUser?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-2 py-2" onClick={() => navigate('/dashboard/account')}>
          <Settings size={16} strokeWidth={1.9} />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="px-2 py-2"
          disabled={loggingOut}
          onClick={async () => {
            if (loggingOut) return
            setLoggingOut(true)
            try {
              await logout()
            } finally {
              setLoggingOut(false)
            }
          }}
        >
          <LogOut size={16} strokeWidth={1.9} />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

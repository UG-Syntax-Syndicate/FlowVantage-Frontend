import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useLogout } from '../../hooks/useLogout'
import { Avatar } from '../common/Avatar'
import { getUserAvatarUrl } from '../../lib/avatars'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function UserMenu() {
  const { currentUser, userProfile } = useAuth()
  const navigate = useNavigate()
  const logout = useLogout()
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger title="Account" aria-label="Account menu">
        <Avatar
          photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? currentUser?.uid ?? currentUser?.email ?? 'user')}
          name={userProfile?.name ?? currentUser?.email}
          size={36}
          ringed
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-52 p-1.5">
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

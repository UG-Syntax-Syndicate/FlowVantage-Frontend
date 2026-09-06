import type { ReactNode } from 'react'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../common/Avatar'
import { getUserAvatarUrl } from '../../lib/avatars'
import { UserMenu } from './UserMenu'

interface PageHeaderBarProps {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  actions?: ReactNode
  showUserMeta?: boolean
}

export function PageHeaderBar({
  title,
  subtitle,
  searchPlaceholder = 'Search for anything...',
  searchValue,
  onSearchChange,
  actions,
  showUserMeta = false,
}: PageHeaderBarProps) {
  const { userProfile, currentUser } = useAuth()

  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0px_18px_37px_3px_rgba(90,82,128,0.24)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-5">
      <div className="min-w-0 sm:flex-1">
        <p className="truncate text-[15px] font-extrabold text-slate-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-500 transition focus-within:bg-slate-200/70 sm:min-w-[160px] sm:max-w-xs">
          <Search size={16} strokeWidth={1.9} className="shrink-0 text-slate-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
            className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </label>

        {actions}
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <Bell size={18} strokeWidth={1.9} />
        </button>
        <UserMenu side="bottom" align="end" triggerClassName="rounded-full sm:rounded-xl sm:px-1 sm:py-1 sm:hover:bg-slate-100">
          <Avatar
            photoURL={getUserAvatarUrl(userProfile?.photoURL, userProfile?.id ?? currentUser?.uid ?? currentUser?.email ?? 'user')}
            name={userProfile?.name ?? currentUser?.email}
            size={36}
          />
          {showUserMeta && (
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-slate-900">
                {userProfile?.name ?? currentUser?.displayName ?? 'Account'}
              </p>
              <p className="truncate text-xs text-slate-400 capitalize">{userProfile?.role ?? 'Member'}</p>
            </div>
          )}
        </UserMenu>
      </div>
    </div>
  )
}

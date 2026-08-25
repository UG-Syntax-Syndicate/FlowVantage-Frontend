import { Plus, Search, HelpCircle, Settings } from 'lucide-react'
import { NAV_ITEMS } from './navItems'
import { NavIcon } from './NavIcon'
import { UserMenu } from './UserMenu'

export function IconRail() {
  return (
    <aside className="hidden w-[64px] shrink-0 flex-col items-center gap-1 bg-rail py-4 lg:flex">
      <button
        type="button"
        disabled
        title="Add new"
        aria-label="Add new"
        className="mb-2 flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-slate-500 opacity-60"
      >
        <Plus size={19} strokeWidth={1.9} />
      </button>

      <NavIcon to="/dashboard/search" label="Search" icon={Search} />

      <div className="my-2 h-px w-8 bg-white/10" />

      {NAV_ITEMS.map((item) => (
        <NavIcon key={item.to} {...item} />
      ))}

      <div className="flex-1" />

      <button
        type="button"
        title="Help"
        aria-label="Help"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rail-hover hover:text-white"
      >
        <HelpCircle size={19} strokeWidth={1.9} />
      </button>

      <NavIcon to="/dashboard/account" label="Account settings" icon={Settings} />

      <div className="mt-2">
        <UserMenu />
      </div>
    </aside>
  )
}

import { Bell, Menu, Search } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        title="Open menu"
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} strokeWidth={1.9} />
      </button>

      <img src="/flow-Vantage-logo.jpeg" alt="Flow Vantage" className="h-8 w-auto rounded-md" />

      <div className="ml-4 hidden flex-1 items-center lg:flex">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">
          <Search size={15} strokeWidth={1.9} />
          Search
        </div>
      </div>

      <div className="flex-1 lg:hidden" />

      <button
        type="button"
        title="Notifications"
        aria-label="Notifications"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <Bell size={18} strokeWidth={1.9} />
      </button>
    </header>
  )
}

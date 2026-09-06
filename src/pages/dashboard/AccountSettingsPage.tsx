import { NavLink, Outlet } from 'react-router-dom'
import { SETTINGS_NAV_GROUPS } from '../../components/dashboard/account/settingsNav'

export function AccountSettingsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row lg:gap-8">
      {/* Below lg, the group wrappers collapse via `contents` so every item
          across both groups lays out as one continuous horizontally
          scrollable pill row; at lg: they restore to the original
          vertical list-with-headers layout. */}
      <nav className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:gap-6 lg:overflow-visible lg:pb-0">
        {SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.label} className="contents lg:block">
            <p className="hidden px-3 pb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase lg:block">
              {group.label}
            </p>
            <ul className="contents lg:block lg:space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to} className="contents lg:block">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition lg:rounded-lg lg:gap-2.5 ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <item.icon size={17} strokeWidth={1.9} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

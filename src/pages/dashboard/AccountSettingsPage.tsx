import { NavLink, Outlet } from 'react-router-dom'
import { SETTINGS_NAV_GROUPS } from '../../components/dashboard/account/settingsNav'

export function AccountSettingsPage() {
  return (
    <div className="flex w-full gap-8 px-4 py-8 sm:px-8">
      <nav className="w-56 shrink-0 space-y-6">
        {SETTINGS_NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
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

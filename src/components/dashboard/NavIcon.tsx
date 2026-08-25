import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface NavIconProps {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function NavIcon({ to, label, icon: Icon, end }: NavIconProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `flex h-10 w-10 items-center justify-center rounded-xl transition ${
          isActive
            ? 'bg-accent-500 text-white'
            : 'text-slate-400 hover:bg-rail-hover hover:text-white'
        }`
      }
    >
      <Icon size={19} strokeWidth={1.9} />
    </NavLink>
  )
}

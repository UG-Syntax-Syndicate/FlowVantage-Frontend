import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarDays,
  Mail,
  StickyNote,
  Sparkles,
  Package,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** No backend endpoint exists yet - rendered disabled with a "Coming soon" tooltip instead of a link. */
  locked?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dashboard/email', label: 'Email', icon: Mail, locked: true },
  { to: '/dashboard/notes', label: 'Notes', icon: StickyNote },
  { to: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Sparkles, locked: true },
  { to: '/dashboard/inventory', label: 'Inventory', icon: Package, locked: true },
  { to: '/dashboard/reporting', label: 'Reporting', icon: BarChart3, locked: true },
]

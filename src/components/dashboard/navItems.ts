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
  /** Stable selector for the onboarding product tour to anchor a step to. */
  tourId?: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true, tourId: 'nav-dashboard' },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tourId: 'nav-projects' },
  { to: '/dashboard/contacts', label: 'Contacts', icon: Users, tourId: 'nav-contacts' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, tourId: 'nav-calendar' },
  { to: '/dashboard/email', label: 'Email', icon: Mail, tourId: 'nav-email' },
  { to: '/dashboard/notes', label: 'Notes', icon: StickyNote, tourId: 'nav-notes' },
  { to: '/dashboard/ai-assistant', label: 'Venon AI', icon: Sparkles, tourId: 'nav-ai' },
  { to: '/dashboard/inventory', label: 'Inventory', icon: Package, tourId: 'nav-inventory' },
  { to: '/dashboard/reporting', label: 'Reporting', icon: BarChart3, tourId: 'nav-reporting' },
]

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarDays,
  Mail,
  StickyNote,
  Sparkles,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/contacts', label: 'Contacts', icon: Users },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dashboard/email', label: 'Email', icon: Mail },
  { to: '/dashboard/notes', label: 'Notes', icon: StickyNote },
  { to: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Sparkles },
]

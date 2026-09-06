import { Grid2x2, UserRound, Bell, Globe, Settings, Users, CreditCard } from 'lucide-react'

export interface SettingsNavItem {
  to: string
  label: string
  icon: typeof Grid2x2
  end?: boolean
}

export interface SettingsNavGroup {
  label: string
  items: SettingsNavItem[]
}

export const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: 'General settings',
    items: [
      { to: '/dashboard/account/integrations', label: 'Integrations', icon: Grid2x2 },
      { to: '/dashboard/account', label: 'Account', icon: UserRound, end: true },
      { to: '/dashboard/account/notifications', label: 'Notification', icon: Bell },
      { to: '/dashboard/account/language', label: 'Language & Region', icon: Globe },
    ],
  },
  {
    label: 'Workspace settings',
    items: [
      { to: '/dashboard/account/workspace/general', label: 'General', icon: Settings },
      { to: '/dashboard/account/workspace/members', label: 'Members', icon: Users },
      { to: '/dashboard/account/workspace/billing', label: 'Billing', icon: CreditCard },
    ],
  },
]

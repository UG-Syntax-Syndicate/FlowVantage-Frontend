export type UserRole = 'owner'

export type AuthProviderId = 'password' | 'google.com' | 'microsoft.com'

export interface NotificationPreferences {
  emailOnAssignment: boolean
  emailOnMention: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  authProvider: AuthProviderId
  photoURL: string | null
  createdAt: unknown
  notificationPreferences: NotificationPreferences
}

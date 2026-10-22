export type UserRole = 'owner'

export type AuthProviderId = 'password' | 'google.com' | 'microsoft.com'

export interface NotificationPreferences {
  emailOnAssignment: boolean
  emailOnMention: boolean
  weeklyDigest: boolean
  productUpdates: boolean
}

/**
 * The optional profile collected by the onboarding wizard.
 *
 * Every field is nullable and every field is optional. The PRD commits to GDPR
 * compliance for an EU user base, and data minimisation means not requiring
 * what the product does not need - a project-management tool that refuses to
 * work without your nationality invites the obvious question. Each field's UI
 * states what it is actually used for.
 *
 * `age` is derived server-side from `dateOfBirth` and is read-only here. A
 * stored age is wrong within a year of being written, and nothing would notice.
 */
export interface ExtendedProfile {
  dateOfBirth: string | null
  readonly age: number | null
  nationality: string | null
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  country: string | null
  jobTitle: string | null
  company: string | null
  teamSize: string | null
  timezone: string | null
  locale: string | null
  /** Set when the onboarding wizard finishes, so it is not shown again. */
  profileCompletedAt: string | null
}

/** The fields a client may send to PATCH /auth/me - everything bar the derived age. */
export type ExtendedProfileUpdate = Partial<Omit<ExtendedProfile, 'age'>>

export interface UserProfile extends ExtendedProfile {
  id: string
  name: string
  email: string
  role: UserRole
  authProvider: AuthProviderId
  photoURL: string | null
  createdAt: string | null
  notificationPreferences: NotificationPreferences
}

/**
 * The fields that count towards profile completeness, and the label shown when
 * one is missing. Deliberately excludes address line 2 and region, which are
 * genuinely optional for most addresses - counting them would cap the figure
 * below 100% for a perfectly complete profile, which is worse than motivating.
 */
export const PROFILE_COMPLETENESS_FIELDS: { key: keyof ExtendedProfile | 'photoURL'; label: string }[] = [
  { key: 'photoURL', label: 'Profile photo' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone number' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'timezone', label: 'Timezone' },
]

/** Filled fields over total, as a whole percentage. */
export function profileCompleteness(profile: UserProfile | null): { percent: number; missing: string[] } {
  if (!profile) return { percent: 0, missing: PROFILE_COMPLETENESS_FIELDS.map((field) => field.label) }

  const missing = PROFILE_COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field.key as keyof UserProfile]
    return value === null || value === undefined || value === ''
  }).map((field) => field.label)

  const filled = PROFILE_COMPLETENESS_FIELDS.length - missing.length
  return { percent: Math.round((filled / PROFILE_COMPLETENESS_FIELDS.length) * 100), missing }
}

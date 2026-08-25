import type { UserProfile, UserRole } from '../types/user'

// Single role in the MVP; add roles here as multi-user support (PRD Phase 3) arrives.
export const ROLES: UserRole[] = ['owner']

export function hasRole(profile: UserProfile | null, role: UserRole): boolean {
  return profile?.role === role
}

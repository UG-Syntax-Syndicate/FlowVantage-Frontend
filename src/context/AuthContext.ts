import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types/user'

export interface TwoFactorChallenge {
  userId: string
}

export interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  backendSessionToken: string | null
  emailVerified: boolean
  twoFactorChallenge: TwoFactorChallenge | null
  resolveTwoFactorChallenge: (sessionToken: string) => void
  cancelTwoFactorChallenge: () => Promise<void>
  /** True once an idle session has been silently signed out, until acknowledged. */
  sessionExpired: boolean
  /** Signs out due to inactivity without navigating — ProtectedRoute shows a blocking screen instead. */
  expireSession: () => Promise<void>
  /** Confirms sign-out is fully complete before clearing the flag, so navigating to /login can't race a still-in-flight signOut(). */
  acknowledgeSessionExpired: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

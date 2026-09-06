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
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

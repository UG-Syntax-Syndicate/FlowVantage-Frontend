import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types/user'

export interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  backendSessionToken: string | null
  emailVerified: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

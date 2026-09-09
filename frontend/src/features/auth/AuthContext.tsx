import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { AppUser } from '../../types/auth.types'

interface AuthContextValue {
  user: AppUser | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => useContext(AuthContext)

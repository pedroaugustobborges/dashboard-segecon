import { useAuth } from './useAuth'

export function useUserRole() {
  const { user, loading } = useAuth()
  return {
    role:            user?.role ?? null,
    isAdmin:         user?.role === 'Admin',
    isAnalista:      user?.role === 'Analista',
    scopedEntidades: user?.entidades ?? [],
    loading,
  }
}

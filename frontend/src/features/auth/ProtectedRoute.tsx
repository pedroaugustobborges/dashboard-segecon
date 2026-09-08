import { Navigate, Outlet } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuthContext } from './AuthContext'
import type { UserRole } from '../../types/auth.types'

interface Props {
  requiredRole?: UserRole
}

export function ProtectedRoute({ requiredRole }: Props) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/visao-geral" replace />

  return <Outlet />
}

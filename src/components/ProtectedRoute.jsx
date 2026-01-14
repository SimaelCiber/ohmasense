import { Navigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '@heroui/react'

export const ProtectedRoute = ({ children, requireStaff = false, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />
  }

  if (requireStaff && !['admin', 'staff'].includes(profile?.role)) {
    return <Navigate to="/" />
  }

  return children
}

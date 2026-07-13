import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/auth-context'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return children
}

export function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  return children
}

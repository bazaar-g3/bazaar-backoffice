import { Navigate } from 'react-router-dom'

/**
 * Wrapper que protege rutas que requieren autenticación.
 * Si no hay token en localStorage redirige al login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

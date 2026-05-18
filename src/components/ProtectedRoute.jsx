import { Navigate } from 'react-router-dom'

/**
 * Decodifica el payload de un JWT para leer el rol y 
 *  decidir si mostrar el panel o redirigir al login.
 *
 * @param {string} token
 * @returns {{ sub: string, role: string } | null}
 */
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

/**
 * Protege las rutas del backoffice.
 *  Sin token redirige a /login, con token valido verifica tambien el rol. Si no es admin
 * redirige a /login con mensaje de permisos.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) return <Navigate to="/login" replace />

  const payload = parseJwtPayload(token)

  // Token malformado o expirado (sin payload decodificable)
  if (!payload) {
    localStorage.removeItem('token')
    return <Navigate to="/login" replace />
  }

  // Token real pero sin permisos de admin
  if (payload.role !== 'admin') {
    localStorage.removeItem('token')
    return <Navigate to="/login?error=forbidden" replace />
  }

  return children
}
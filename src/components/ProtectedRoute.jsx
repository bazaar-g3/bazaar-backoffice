import { Navigate } from 'react-router-dom'
import { parseJwtPayload } from '../utils/jwt'

/**
 * Componente de ruta protegida para el panel de administración.
 *
 * Verifica que el usuario tenga un token JWT válido con rol `'admin'` antes de
 * renderizar el contenido protegido. Hay tres casos posibles:
 *
 * 1. Sin token en `localStorage` → redirige a `/login`.
 * 2. Token presente pero malformado o con payload no decodificable → elimina el token
 *    y redirige a `/login`.
 * 3. Token válido pero con rol distinto de `'admin'` → elimina el token y redirige
 *    a `/login?error=forbidden` para que la página de login muestre un mensaje de permisos.
 * 4. Token válido con `role === 'admin'` → renderiza los `children`.
 *
 * @param {{ children: React.ReactNode }} props
 * @param {React.ReactNode} props.children - Contenido de la ruta protegida a renderizar si el acceso es válido.
 * @returns {JSX.Element} Los `children` si el acceso está autorizado, o un `<Navigate>` en caso contrario.
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

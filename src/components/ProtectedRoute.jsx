import { Navigate } from 'react-router-dom'

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 *
 * La verificación criptográfica real ocurre en el servidor. Acá solo se extrae
 * el rol del payload para tomar decisiones de navegación en el cliente,
 * evitando un round-trip innecesario al servidor.
 *
 * @param {string} token - JWT en formato header.payload.signature (base64url).
 * @returns {{ sub: string, role: string } | null} Payload decodificado, o `null` si el token es inválido o está malformado.
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

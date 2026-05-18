import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api'
import { COLORS } from '../constants/colors'

/**
 * Decodifica el payload de un JWT sin verificar la firma para extraer el rol y
 * decidir si el usuario tiene acceso al panel antes de navegar.
 *
 * @param {string} token - JWT en formato header.payload.signature (base64url).
 * @returns {{ sub: string, role: string } | null} Payload decodificado, o null si el token es inválido.
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
 * Página de inicio de sesión del panel de administración.
 *
 * @returns {JSX.Element} Formulario de login centrado en pantalla.
 */
export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Valida los campos del formulario en el cliente antes de hacer el request.
   * Muestra el primer error encontrado en el estado `error`.
   *
   * @returns {boolean} true si el formulario es válido, false si hay errores.
   */
  function validateForm() {
    if (!email.trim()) { setError('El email es obligatorio.'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Ingresá un email válido.'); return false }
    if (!password) { setError('La contraseña es obligatoria.'); return false }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return false }
    return true
  }

  /**
   * Maneja el submit del formulario de login.
   * Valida localmente, llama a la API, verifica el rol admin en el token
   * y redirige al dashboard si todo es correcto.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - Evento de submit del formulario.
   */
  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateForm()) return
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.accessToken ?? res.data.access_token
      if (!token) throw new Error('Token no recibido')

      const payload = parseJwtPayload(token)
      if (payload?.role !== 'admin') {
        setError('No tenés permisos de administrador para acceder al panel.')
        return
      }

      localStorage.setItem('token', token)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Verificá tu email y contraseña.')
      } else if (err.response?.status === 403) {
        setError('No tenés permisos de administrador.')
      } else if (err.response?.status === 404) {
        setError('Usuario no encontrado.')
      } else if (err.message !== 'Token no recibido') {
        setError('Error al iniciar sesión. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>🏪</span>
          <div>
            <div style={styles.logoTitle}>BAZAAR</div>
            <div style={styles.logoSub}>Panel de Administración</div>
          </div>
        </div>

        <h2 style={styles.heading}>Iniciar sesión</h2>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@bazaar.com"
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { fontSize: 32 },
  logoTitle: { fontSize: 20, fontWeight: 800, color: COLORS.primary, letterSpacing: 1 },
  logoSub: { fontSize: 12, color: COLORS.textSecondary },
  heading: { fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 },
  errorBox: {
    backgroundColor: COLORS.errorLight, color: COLORS.error, borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  errorIcon: { flexShrink: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: COLORS.textSecondary },
  input: {
    height: 44, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 12px', fontSize: 14, outline: 'none', color: COLORS.textPrimary,
  },
  btn: {
    height: 46, backgroundColor: COLORS.primary, color: COLORS.white,
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
    marginTop: 4, cursor: 'pointer',
  },
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, AlertTriangle } from 'lucide-react'
import api from '../api/api'
import { loginStyles } from '../styles/login'
import { parseJwtPayload } from '../utils/jwt'

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
          <span style={styles.logoIcon}><Store size={28} /></span>
          <div>
            <div style={styles.logoTitle}>BAZAAR</div>
            <div style={styles.logoSub}>Panel de Administración</div>
          </div>
        </div>

        <h2 style={styles.heading}>Iniciar sesión</h2>

        {error && (
          <div style={styles.errorBox}>
            <AlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} /> {error}
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

const styles = loginStyles

import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Package, ClipboardList, TrendingUp, LogOut, Store } from 'lucide-react'
import { COLORS } from '../constants/colors'

/**
 * Ítems de navegación del panel lateral.
 * Cada entrada define la ruta, la etiqueta visible y el ícono.
 *
 * @type {Array<{ path: string, label: string, icon: string }>}
 */
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { path: '/users', label: 'Usuarios', icon: <Users size={16} /> },
  { path: '/products', label: 'Productos', icon: <Package size={16} /> },
  { path: '/orders', label: 'Órdenes', icon: <ClipboardList size={16} /> },
  { path: '/metrics', label: 'Métricas', icon: <TrendingUp size={16} /> },
]

/**
 * Shell principal del panel de administración.
 *
 * Renderiza la estructura de dos columnas del backoffice:
 * - Una barra lateral fija a la izquierda con el logo, los enlaces de navegación
 *   y el botón de cierre de sesión.
 * - Un área de contenido principal a la derecha que renderiza los `children` pasados.
 *
 * Los ítems de navegación usan `NavLink` de React Router, que aplica estilos
 * de estado activo automáticamente según la ruta actual.
 *
 * @param {{ children: React.ReactNode }} props
 * @param {React.ReactNode} props.children - Contenido de la página activa a renderizar en el área principal.
 * @returns {JSX.Element} Contenedor completo con sidebar y área principal.
 */
export default function Layout({ children }) {
  const navigate = useNavigate()

  /**
   * Cierra la sesión del administrador eliminando el token JWT del almacenamiento local
   * y redirigiendo a la página de login.
   */
  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <Store size={30} color={COLORS.white} style={{ flexShrink: 0 }} />
          <div>
            <div style={styles.logoTitle}>BAZAAR</div>
            <div style={styles.logoSub}>Backoffice Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                backgroundColor: isActive ? COLORS.primary : 'transparent',
                color: isActive ? COLORS.white : '#94a3b8',
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    minWidth: 240,
    backgroundColor: COLORS.sidebar,
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    overflow: 'hidden',
  },
  logoArea: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid #1e293b',
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: COLORS.white,
    letterSpacing: 1,
  },
  logoSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.15s',
    textDecoration: 'none',
  },
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '0 10px',
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: COLORS.background,
  },
}

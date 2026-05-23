import { useState, useEffect } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import { common } from '../styles/common'
import { dashboardStyles } from '../styles/dashboard'

/**
 * Configuración estática de las tarjetas de estadísticas del dashboard.
 * Cada entrada define la clave del dato en el estado `stats`, la etiqueta visible,
 * el ícono y los colores de fondo/texto del ícono.
 *
 * @type {Array<{ key: string, label: string, icon: string, color: string, bg: string }>}
 */
const STAT_CARDS = [
  { key: 'users', label: 'Usuarios registrados', icon: '👥', color: COLORS.info, bg: COLORS.infoLight },
  { key: 'products', label: 'Productos activos', icon: '📦', color: COLORS.success, bg: COLORS.successLight },
  { key: 'orders', label: 'Órdenes totales', icon: '🧾', color: COLORS.warning, bg: COLORS.warningLight },
  { key: 'revenue', label: 'Ingresos del mes', icon: '💰', color: COLORS.primary, bg: COLORS.primaryLight },
]

/**
 * Página principal del panel de administración.
 *
 * Muestra cuatro tarjetas de resumen (usuarios, productos, órdenes, ingresos del mes),
 * una tabla con las últimas cinco órdenes del sistema y dos placeholders para gráficos futuros.
 *
 * Los datos se obtienen en paralelo al montar el componente usando `Promise.allSettled`,
 * de modo que el fallo de uno de los endpoints no bloquea la visualización del otro.
 *
 * @returns {JSX.Element} Vista completa del dashboard con stats, tabla y placeholders de gráficos.
 */
export default function Dashboard() {
  const [stats, setStats] = useState({ users: '—', products: '—', orders: '—', revenue: '—' })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    /**
     * Obtiene los datos estadísticos del sistema en paralelo.
     *
     * Llama a GET /users/ y GET /orders/admin/all de forma concurrente.
     * Si alguno falla, su resultado se descarta y los demás datos siguen mostrándose.
     * Calcula los ingresos del mes filtrando las órdenes creadas a partir del primer día del mes actual.
     * Actualiza el estado `stats` con el total de usuarios (campo `total` de la respuesta paginada),
     * la cantidad de órdenes y el revenue acumulado.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function fetchStats() {
      try {
        const [usersRes, ordersRes] = await Promise.allSettled([
          api.get('/users/'),
          api.get('/orders/admin/all'),
        ])

        // /users/ devuelve { users, total, ... } (paginado)
        const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : null
        const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : []
        const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders ?? []

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart)
        const revenue = monthOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0)

        setStats({
          users: usersData?.total ?? '—',
          products: '—',
          orders: orders.length > 0 ? orders.length : '—',
          revenue: revenue > 0 ? `$${revenue.toLocaleString('es-AR')}` : '$0',
        })

        if (orders.length > 0) {
          setRecentOrders(orders.slice(0, 5))
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Resumen general del sistema</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.key} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={styles.statValue}>
                {loading ? <span style={styles.skeleton} /> : stats[card.key]}
              </div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Últimas órdenes</h2>
        {loading ? (
          <div style={styles.loadingBox}>Cargando…</div>
        ) : recentOrders.length === 0 ? (
          <div style={styles.emptyBox}>No hay órdenes disponibles.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['ID', 'Usuario', 'Estado', 'Total', 'Fecha'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <tr key={order.id ?? i} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.orderId}>#{String(order.id ?? '—').slice(0, 8)}</span>
                    </td>
                    <td style={styles.td}>{order.user_id ?? order.buyer_id ?? '—'}</td>
                    <td style={styles.td}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={styles.td}>
                      ${(order.total_amount ?? order.total ?? 0).toLocaleString('es-AR')}
                    </td>
                    <td style={styles.td}>
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('es-AR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Placeholder charts */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Ventas por período</h3>
          <div style={styles.chartPlaceholder}>
            <span style={styles.chartHint}>📈 Próximamente: gráfico de ventas</span>
          </div>
        </div>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Órdenes por estado</h3>
          <div style={styles.chartPlaceholder}>
            <span style={styles.chartHint}>🍩 Próximamente: gráfico de estados</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Muestra un badge de color según el estado de una orden.
 *
 * Mapea los valores `pending`, `paid`, `cancelled` y `delivered` a etiquetas en español
 * con colores semánticos (amarillo, verde, rojo, azul). Si el estado no está en el mapa,
 * se muestra el valor crudo con estilo neutro.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Estado de la orden (ej: 'pending', 'paid').
 * @returns {JSX.Element} Etiqueta coloreada con el estado de la orden.
 */
function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pendiente', bg: COLORS.warningLight, color: COLORS.warning },
    paid: { label: 'Pagada', bg: COLORS.successLight, color: COLORS.success },
    cancelled: { label: 'Cancelada', bg: COLORS.errorLight, color: COLORS.error },
    delivered: { label: 'Entregada', bg: COLORS.infoLight, color: COLORS.info },
  }
  const s = map[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return (
    <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const styles = { ...common, ...dashboardStyles }

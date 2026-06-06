import { useState, useEffect } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import ordersApi from '../api/ordersApi'
import catalogApi from '../api/catalogApi'
import OrderStatusBadge from '../components/Badges/OrderStatusBadge'
import { common } from '../styles/common'
import { dashboardStyles } from '../styles/dashboard'

const STAT_CARDS = [
  { key: 'users',    label: 'Usuarios registrados', icon: '👥', color: COLORS.info,    bg: COLORS.infoLight    },
  { key: 'products', label: 'Productos activos',     icon: '📦', color: COLORS.success, bg: COLORS.successLight },
  { key: 'orders',   label: 'Total de órdenes',      icon: '🧾', color: COLORS.warning, bg: COLORS.warningLight },
  { key: 'revenue',  label: 'Ingresos totales',      icon: '💰', color: COLORS.primary, bg: COLORS.primaryLight },
]

export default function Dashboard() {
  const [stats, setStats]       = useState({ users: '—', products: '—', orders: '—', revenue: '—' })
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, ordersRes, productsRes] = await Promise.allSettled([
          api.get('/users/'),
          ordersApi.get('/orders/admin/all'),
          catalogApi.get('/products/?status=active&limit=1'),
        ])

        const usersData     = usersRes.status     === 'fulfilled' ? usersRes.value.data     : null
        const ordersData    = ordersRes.status    === 'fulfilled' ? ordersRes.value.data    : {}
        const productsTotal = productsRes.status  === 'fulfilled' ? (productsRes.value.data?.total ?? '—') : '—'

        const orders      = Array.isArray(ordersData) ? ordersData : (ordersData?.orders ?? [])
        const totalOrders = Array.isArray(ordersData) ? ordersData.length : (ordersData?.total ?? orders.length)
        const revenue     = orders.reduce((sum, o) => sum + Number(o.total_amount ?? o.total ?? 0), 0)

        setAllOrders(orders)
        setStats({
          users:    usersData?.total ?? '—',
          products: productsTotal,
          orders:   totalOrders > 0 ? totalOrders : '—',
          revenue:  `$${revenue.toLocaleString('es-AR')}`,
        })
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const recentOrders = allOrders.slice(0, 5)

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
                      <OrderStatusBadge status={order.status} />
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
    </div>
  )
}


const styles = { ...common, ...dashboardStyles }

import { useState, useEffect, useMemo } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import ordersApi from '../api/ordersApi'
import catalogApi from '../api/catalogApi'
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
  { key: 'users',    label: 'Usuarios registrados', icon: '👥', color: COLORS.info,    bg: COLORS.infoLight    },
  { key: 'products', label: 'Productos activos',     icon: '📦', color: COLORS.success, bg: COLORS.successLight },
  { key: 'orders',   label: 'Órdenes del período',   icon: '🧾', color: COLORS.warning, bg: COLORS.warningLight },
  { key: 'revenue',  label: 'Ingresos del período',  icon: '💰', color: COLORS.primary, bg: COLORS.primaryLight },
]

/**
 * Períodos predefinidos disponibles para filtrar métricas.
 * Seleccionar un período activo lo deselecciona (toggle).
 *
 * @type {Array<{ days: number, label: string }>}
 */
const PERIODS = [
  { days: 7,  label: '7 días'  },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
]

/**
 * Página principal del panel de administración.
 *
 * Muestra cuatro tarjetas de resumen (usuarios, productos, órdenes, ingresos),
 * un selector de período que filtra órdenes y estadísticas derivadas,
 * una tabla con las últimas cinco órdenes del sistema y dos placeholders para gráficos futuros.
 *
 * Los datos se obtienen en paralelo al montar el componente usando `Promise.allSettled`,
 * de modo que el fallo de uno de los endpoints no bloquea la visualización del otro.
 *
 * @returns {JSX.Element} Vista completa del dashboard con stats, selector de período, tabla y placeholders de gráficos.
 */
export default function Dashboard() {
  const [stats, setStats]                   = useState({ users: '—', products: '—' })
  const [allOrders, setAllOrders]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(null)

  useEffect(() => {
    /**
     * Obtiene los datos estadísticos del sistema en paralelo.
     *
     * Llama a GET /users/ y GET /orders/admin/all de forma concurrente.
     * Si alguno falla, su resultado se descarta y los demás datos siguen mostrándose.
     * Almacena todas las órdenes en `allOrders`; las estadísticas derivadas de órdenes
     * se calculan en `periodStats` según el período seleccionado.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function fetchStats() {
      try {
        const [usersRes, ordersRes, productsRes] = await Promise.allSettled([
          api.get('/users/'),
          ordersApi.get('/orders/admin/all'),
          catalogApi.get('/products/?status=active&limit=1'),
        ])

        const usersData  = usersRes.status  === 'fulfilled' ? usersRes.value.data  : null
        const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : []
        const productsTotal = productsRes.status === 'fulfilled' ? (productsRes.value.data?.total ?? '—') : '—'
        const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders ?? []

        setStats({ users: usersData?.total ?? '—', products: productsTotal })
        setAllOrders(orders)

      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  /**
   * Órdenes filtradas según el período seleccionado.
   * Si no hay período activo, devuelve todas las órdenes.
   *
   * @type {Array<object>}
   */
  const filteredOrders = useMemo(() => {
    if (!selectedPeriod || allOrders.length === 0) return allOrders
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - selectedPeriod)
    return allOrders.filter(o => new Date(o.created_at) >= cutoff)
  }, [allOrders, selectedPeriod])

  /**
   * Estadísticas derivadas de las órdenes del período activo.
   * `orders` y `revenue` se recalculan al cambiar el período; `users` y `products`
   * no dependen del filtro temporal.
   *
   * @type {{ users: string|number, products: string|number, orders: string|number, revenue: string }}
   */
  const periodStats = useMemo(() => {
    const orders  = selectedPeriod ? filteredOrders : allOrders
    const revenue = orders.reduce((sum, o) => sum + (o.total_amount ?? o.total ?? 0), 0)
    return {
      ...stats,
      orders:  orders.length > 0 ? orders.length : '—',
      revenue: `$${revenue.toLocaleString('es-AR')}`,
    }
  }, [stats, allOrders, filteredOrders, selectedPeriod])

  const recentOrders = allOrders.slice(0, 5)

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Resumen general del sistema</p>
        </div>
        <PeriodSelector selected={selectedPeriod} onChange={setSelectedPeriod} />
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
                {loading ? <span style={styles.skeleton} /> : periodStats[card.key]}
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
 * Selector de período predefinido para filtrar métricas del dashboard.
 *
 * Renderiza botones para cada período disponible en `PERIODS`.
 * Hacer clic en el período activo lo deselecciona (toggle).
 *
 * @param {{ selected: number|null, onChange: (days: number|null) => void }} props
 * @param {number|null} props.selected - Cantidad de días del período activo, o null si no hay selección.
 * @param {Function}    props.onChange - Callback invocado con el nuevo valor de período (o null al deseleccionar).
 * @returns {JSX.Element}
 */
function PeriodSelector({ selected, onChange }) {
  return (
    <div style={styles.periodSelector}>
      {PERIODS.map(({ days, label }) => (
        <button
          key={days}
          onClick={() => onChange(selected === days ? null : days)}
          style={{
            ...styles.periodBtn,
            ...(selected === days ? styles.periodBtnActive : {}),
          }}
        >
          {label}
        </button>
      ))}
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
    pending:   { label: 'Pendiente', bg: COLORS.warningLight, color: COLORS.warning },
    paid:      { label: 'Pagada',    bg: COLORS.successLight, color: COLORS.success  },
    cancelled: { label: 'Cancelada', bg: COLORS.errorLight,   color: COLORS.error    },
    delivered: { label: 'Entregada', bg: COLORS.infoLight,    color: COLORS.info     },
  }
  const s = map[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return (
    <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

const styles = { ...common, ...dashboardStyles }

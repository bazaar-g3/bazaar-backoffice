import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import ordersApi from '../api/ordersApi'
import { common } from '../styles/common'
import { metricsStyles } from '../styles/metrics'

const STATUS_LABELS = {
  pending_payment:    'Pago pendiente',
  confirmed:          'Confirmada',
  in_preparation:     'En preparación',
  shipped:            'Enviada',
  delivered:          'Entregada',
  payment_rejected:   'Pago rechazado',
  cancelled:          'Cancelada',
  refund_in_progress: 'Reembolso en proceso',
  refund_processed:   'Reembolsada',
}

const PIE_COLORS = [
  COLORS.primary, COLORS.secondary, COLORS.info, COLORS.success,
  COLORS.warning, COLORS.error, '#8b5cf6', '#ec4899', '#14b8a6',
]

const PERIOD_OPTIONS = [
  { value: 7,  label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

export default function Metrics() {
  const [period, setPeriod]         = useState(30)
  const [loading, setLoading]       = useState(true)
  const [usersData, setUsersData]   = useState(null)
  const [ordersData, setOrdersData] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [byCategory, setByCategory]   = useState([])

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)
      try {
        const [usersRes, ordersRes, revenueRes, topProductsRes, byCategoryRes] =
          await Promise.allSettled([
            api.get(`/admin/metrics/users?days=${period}`),
            ordersApi.get(`/admin/metrics/orders?days=${period}`),
            ordersApi.get(`/admin/metrics/revenue?days=${period}`),
            ordersApi.get(`/admin/metrics/top-products?days=${period}&limit=10`),
            ordersApi.get(`/admin/metrics/by-category?days=${period}`),
          ])

        setUsersData(usersRes.status === 'fulfilled' ? usersRes.value.data : null)
        setOrdersData(ordersRes.status === 'fulfilled' ? ordersRes.value.data : null)
        setRevenueData(revenueRes.status === 'fulfilled' ? revenueRes.value.data : null)
        setTopProducts(topProductsRes.status === 'fulfilled' ? topProductsRes.value.data.products ?? [] : [])
        setByCategory(byCategoryRes.status === 'fulfilled' ? byCategoryRes.value.data.categories ?? [] : [])
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [period])

  const pieData = ordersData?.by_status
    ? Object.entries(ordersData.by_status)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: STATUS_LABELS[key] ?? key, value }))
    : []

  const lineData = ordersData?.daily ?? []

  const STAT_CARDS = [
    {
      key: 'new_users',
      label: 'Usuarios nuevos',
      icon: '👥',
      color: COLORS.info,
      bg: COLORS.infoLight,
      value: usersData?.new_users ?? '—',
    },
    {
      key: 'total_orders',
      label: 'Órdenes totales',
      icon: '🧾',
      color: COLORS.warning,
      bg: COLORS.warningLight,
      value: ordersData?.total ?? '—',
    },
    {
      key: 'revenue',
      label: 'Revenue del período',
      icon: '💰',
      color: COLORS.primary,
      bg: COLORS.primaryLight,
      value: revenueData?.total_revenue != null
        ? `$${revenueData.total_revenue.toLocaleString('es-AR')}`
        : '—',
    },
    {
      key: 'delivered',
      label: 'Órdenes entregadas',
      icon: '✅',
      color: COLORS.success,
      bg: COLORS.successLight,
      value: ordersData?.by_status?.delivered ?? '—',
    },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Métricas</h1>
          <p style={styles.subtitle}>Análisis y estadísticas del sistema</p>
        </div>
        <div style={styles.periodSelector}>
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              style={{
                ...styles.periodBtn,
                ...(period === opt.value ? styles.periodBtnActive : {}),
              }}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.key} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div>
              <div style={styles.statValue}>
                {loading ? <span style={styles.skeleton} /> : card.value}
              </div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Distribución por estado</h3>
          {loading ? (
            <div style={styles.loadingBox}>Cargando…</div>
          ) : pieData.length === 0 ? (
            <div style={styles.emptyBox}>No hay datos para el período seleccionado</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Evolución de órdenes</h3>
          {loading ? (
            <div style={styles.loadingBox}>Cargando…</div>
          ) : lineData.length === 0 ? (
            <div style={styles.emptyBox}>No hay datos para el período seleccionado</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  tickFormatter={d => d.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={d => `Fecha: ${d}`}
                  formatter={v => [v, 'Órdenes']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={styles.tablesRow}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Top productos</h2>
          {loading ? (
            <div style={styles.loadingBox}>Cargando…</div>
          ) : topProducts.length === 0 ? (
            <div style={styles.emptyBox}>No hay datos para el período seleccionado</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Producto', 'Categoría', 'Unidades vendidas'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.product_id ?? i} style={styles.tr}>
                      <td style={styles.td}>{p.product_name ?? '—'}</td>
                      <td style={styles.td}>{p.category_label ?? p.category_slug ?? '—'}</td>
                      <td style={styles.td}>{p.units_sold ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Métricas por categoría</h2>
          {loading ? (
            <div style={styles.loadingBox}>Cargando…</div>
          ) : byCategory.length === 0 ? (
            <div style={styles.emptyBox}>No hay datos para el período seleccionado</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Categoría', 'Órdenes', 'Revenue'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((c, i) => (
                    <tr key={c.category_slug ?? i} style={styles.tr}>
                      <td style={styles.td}>{c.category_label ?? c.category_slug ?? '—'}</td>
                      <td style={styles.td}>{c.order_count ?? '—'}</td>
                      <td style={styles.td}>
                        {c.total_revenue != null
                          ? `$${c.total_revenue.toLocaleString('es-AR')}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = { ...common, ...metricsStyles }

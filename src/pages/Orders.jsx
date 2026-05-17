import { useState, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'

const STATUS_OPTIONS = ['Todos', 'pending', 'paid', 'cancelled', 'delivered']

const STATUS_LABELS = {
  pending:   { label: 'Pendiente',  bg: COLORS.warningLight, color: COLORS.warning },
  paid:      { label: 'Pagada',     bg: COLORS.successLight, color: COLORS.success },
  cancelled: { label: 'Cancelada',  bg: COLORS.errorLight,   color: COLORS.error   },
  delivered: { label: 'Entregada',  bg: COLORS.infoLight,    color: COLORS.info    },
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [expandedId, setExpandedId] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/orders/admin/all')
      const data = res.data
      setOrders(Array.isArray(data) ? data : data.orders ?? [])
    } catch {
      setError('No se pudieron cargar las órdenes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch =
      String(o.id ?? '').toLowerCase().includes(q) ||
      String(o.user_id ?? o.buyer_id ?? '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'Todos' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Órdenes</h1>
          <p style={styles.subtitle}>Soporte técnico — todas las órdenes del sistema</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchOrders} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* Filters */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          type="text"
          placeholder="Buscar por ID de orden o usuario…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={styles.filterGroup}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === s ? styles.filterBtnActive : {}),
              }}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'Todos' ? 'Todos' : (STATUS_LABELS[s]?.label ?? s)}
            </button>
          ))}
        </div>

        <span style={styles.count}>
          {loading ? '…' : `${filtered.length} orden${filtered.length !== 1 ? 'es' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.center}>Cargando órdenes…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.center}>No hay órdenes que coincidan con los filtros.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['ID Orden', 'Usuario', 'Estado', 'Total', 'Pago', 'Fecha', 'Detalle'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <>
                    <tr
                      key={order.id}
                      style={{ ...styles.tr, cursor: 'pointer' }}
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td style={styles.td}>
                        <span style={styles.mono}>#{String(order.id ?? '').slice(0, 12)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mono}>{String(order.user_id ?? order.buyer_id ?? '—').slice(0, 8)}</span>
                      </td>
                      <td style={styles.td}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={styles.td}>
                        ${(order.total_amount ?? order.total ?? 0).toLocaleString('es-AR')}
                      </td>
                      <td style={styles.td}>
                        <PaymentBadge status={order.payment_status} />
                      </td>
                      <td style={styles.td}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.expandIcon}>{expandedId === order.id ? '▲' : '▼'}</span>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} style={styles.expandedCell}>
                          <OrderDetail order={order} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function OrderDetail({ order }) {
  const items = order.items ?? order.order_items ?? []
  return (
    <div style={styles.detailBox}>
      <div style={styles.detailGrid}>
        <DetailField label="ID completo" value={order.id} mono />
        <DetailField label="Usuario" value={order.user_id ?? order.buyer_id} mono />
        <DetailField label="Estado de pago" value={order.payment_status ?? '—'} />
        <DetailField label="Método de pago" value={order.payment_method ?? '—'} />
        <DetailField label="Dirección" value={order.shipping_address ?? '—'} />
        <DetailField label="Actualizado" value={order.updated_at ? new Date(order.updated_at).toLocaleString('es-AR') : '—'} />
      </div>

      {items.length > 0 && (
        <div style={styles.itemsSection}>
          <div style={styles.itemsTitle}>Ítems</div>
          {items.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <span>{item.product_name ?? item.name ?? `Producto #${item.product_id ?? i}`}</span>
              <span style={styles.itemQty}>x{item.quantity ?? 1}</span>
              <span>${(item.unit_price ?? item.price ?? 0).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value, mono }) {
  return (
    <div style={styles.detailField}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={{ ...styles.detailValue, ...(mono ? { fontFamily: 'monospace', fontSize: 12 } : {}) }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

function PaymentBadge({ status }) {
  const map = {
    approved: { label: 'Aprobado', bg: COLORS.successLight, color: COLORS.success },
    pending:  { label: 'Pendiente', bg: COLORS.warningLight, color: COLORS.warning },
    rejected: { label: 'Rechazado', bg: COLORS.errorLight,   color: COLORS.error   },
  }
  const s = map[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

const styles = {
  page: { padding: '32px 36px', maxWidth: 1100 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, margin: 0 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, margin: '4px 0 0' },
  refreshBtn: {
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  search: {
    flex: 1, minWidth: 200, height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 14px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  filterGroup: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    padding: '6px 12px', borderRadius: 20, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary, fontSize: 12,
    fontWeight: 600, cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary, color: COLORS.white, border: `1px solid ${COLORS.primary}`,
  },
  count: { fontSize: 13, color: COLORS.textSecondary, whiteSpace: 'nowrap' },
  errorBox: {
    backgroundColor: COLORS.errorLight, color: COLORS.error, borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  center: { textAlign: 'center', color: COLORS.textSecondary, padding: '48px 0', fontSize: 14 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '12px 16px', fontWeight: 600,
    color: COLORS.textSecondary, backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap',
  },
  tr: { borderBottom: `1px solid ${COLORS.border}` },
  td: { padding: '11px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  expandIcon: { fontSize: 10, color: COLORS.textMuted, cursor: 'pointer' },

  expandedCell: { padding: 0, backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` },
  detailBox: { padding: '16px 20px' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 20px', marginBottom: 16 },
  detailField: {},
  detailLabel: { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 13, color: COLORS.textPrimary },

  itemsSection: {},
  itemsTitle: { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  itemRow: {
    display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0',
    borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textPrimary,
  },
  itemQty: { color: COLORS.textSecondary, minWidth: 30 },
}

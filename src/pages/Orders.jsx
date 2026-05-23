import { useState, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'

/**
 * Opciones de filtro por estado de orden disponibles en la barra de herramientas.
 * `'Todos'` representa la opción sin filtro activo.
 *
 * @type {string[]}
 */
const STATUS_OPTIONS = [
  'Todos',
  'pending_payment',
  'confirmed',
  'in_preparation',
  'shipped',
  'delivered',
  'payment_rejected',
]

const STATUS_LABELS = {
  pending_payment:  { label: 'Pend. de pago', bg: COLORS.warningLight, color: COLORS.warning },
  confirmed:        { label: 'Confirmada',    bg: COLORS.infoLight,    color: COLORS.info    },
  in_preparation:   { label: 'En preparación',bg: COLORS.infoLight,    color: COLORS.info    },
  shipped:          { label: 'Enviada',       bg: COLORS.primaryLight, color: COLORS.primary },
  delivered:        { label: 'Entregada',     bg: COLORS.successLight, color: COLORS.success },
  payment_rejected: { label: 'Pago rechazado',bg: COLORS.errorLight,   color: COLORS.error   },
}

/**
 * Página de visualización de órdenes del sistema para soporte técnico.
 *
 * Carga todas las órdenes desde GET /orders/admin/all al montar el componente
 * y aplica filtros en el cliente (sin paginación server-side) ya que el volumen
 * de datos es manejable. Permite:
 * - Búsqueda libre por ID de orden o ID de usuario.
 * - Filtro por estado mediante pills (Todos / Pendiente / Pagada / Cancelada / Entregada).
 * - Filas expandibles: al hacer clic en una fila se muestra `OrderDetail` con
 *   información completa de la orden (método de pago, dirección, ítems, etc.).
 *
 * @returns {JSX.Element} Vista de listado de órdenes con filtros y filas expandibles.
 */
const PAGE_SIZE = 20

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [expandedId, setExpandedId] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchOrders = useCallback(async (currentPage = 1, currentStatus = 'Todos') => {
    setLoading(true)
    setError('')
    try {
      const params = { page: currentPage, page_size: PAGE_SIZE }
      if (currentStatus !== 'Todos') params.status = currentStatus
      const res = await api.get('/orders/admin/all', { params })
      const data = res.data
      if (Array.isArray(data)) {
        setOrders(data)
        setTotalOrders(data.length)
        setTotalPages(1)
      } else {
        setOrders(data.orders ?? [])
        setTotalOrders(data.total ?? 0)
        setTotalPages(data.pages ?? 1)
      }
    } catch {
      setError('No se pudieron cargar las órdenes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders(page, statusFilter)
  }, [fetchOrders, page, statusFilter])

  useEffect(() => {
    if (!expandedId) {
      setExpandedDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    setExpandedDetail(null)
    api.get(`/orders/admin/${expandedId}`)
      .then(res => { if (!cancelled) setExpandedDetail(res.data) })
      .catch(() => { if (!cancelled) setExpandedDetail(null) })
      .finally(() => { if (!cancelled) setLoadingDetail(false) })
    return () => { cancelled = true }
  }, [expandedId])

  /**
   * Lista de órdenes filtrada por búsqueda y estado, calculada de forma derivada.
   * La búsqueda es case-insensitive y compara contra el ID de la orden y el ID del usuario.
   * El filtro de estado se aplica solo cuando no es `'Todos'`.
   *
   * @type {Array<Object>}
   */
  // El filtro de estado es server-side; aquí solo filtramos por búsqueda local.
  const filtered = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      String(o.id ?? '').toLowerCase().includes(q) ||
      String(o.user_id ?? o.buyer_id ?? '').toLowerCase().includes(q)
    )
  })

  const handleStatusChange = (s) => {
    setStatusFilter(s)
    setPage(1)
    setExpandedId(null)
  }

  const handlePageChange = (next) => {
    setPage(next)
    setExpandedId(null)
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Órdenes</h1>
          <p style={styles.subtitle}>Soporte técnico — todas las órdenes del sistema</p>
        </div>
        <button style={styles.refreshBtn} onClick={() => fetchOrders(page, statusFilter)} disabled={loading}>
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarRow}>
          <input
            style={styles.search}
            type="text"
            placeholder="Buscar por ID de orden o usuario…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={styles.count}>
            {loading ? '…' : `${totalOrders} orden${totalOrders !== 1 ? 'es' : ''}`}
          </span>
        </div>

        <div style={styles.filterGroup}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === s ? styles.filterBtnActive : {}),
              }}
              onClick={() => handleStatusChange(s)}
            >
              {s === 'Todos' ? 'Todos' : (STATUS_LABELS[s]?.label ?? s)}
            </button>
          ))}
        </div>
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
                          {loadingDetail
                            ? <div style={styles.center}>Cargando detalle…</div>
                            : expandedDetail
                              ? <OrderDetail order={expandedDetail} />
                              : <div style={styles.center}>No se pudo cargar el detalle.</div>
                          }
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ← Anterior
          </button>
          <span style={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>
          <button
            style={{ ...styles.pageBtn, ...(page === totalPages ? styles.pageBtnDisabled : {}) }}
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Panel de detalle de una orden, mostrado como fila expandida en la tabla.
 *
 * Presenta en una grilla los campos principales de la orden (ID completo, usuario,
 * estado de pago, método de pago, dirección de envío, fecha de actualización) y,
 * si existen, la lista de ítems con nombre, cantidad y precio unitario.
 *
 * Normaliza nombres de campo alternativos para compatibilidad con distintos microservicios
 * (ej: `items` vs `order_items`, `product_name` vs `name`, `unit_price` vs `price`).
 *
 * @param {{ order: Object }} props
 * @param {Object} props.order - Objeto de orden con todos sus campos.
 * @returns {JSX.Element} Panel de detalle con grilla de campos e ítems.
 */
function formatAddress(addr) {
  if (!addr) return '—'
  if (typeof addr === 'string') return addr
  const { calle, altura, departamento, zona, codigo_postal } = addr
  let s = `${calle} ${altura}`
  if (departamento) s += ` Dpto. ${departamento}`
  if (zona) s += `, ${zona}`
  if (codigo_postal) s += ` (CP ${codigo_postal})`
  return s
}

function OrderDetail({ order }) {
  const items = order.items ?? order.order_items ?? []
  return (
    <div style={styles.detailBox}>
      <div style={styles.detailGrid}>
        <DetailField label="ID completo" value={order.id} mono />
        <DetailField label="Comprador" value={order.user_id ?? order.buyer_id} mono />
        <DetailField label="Estado" value={order.status ?? '—'} />
        <DetailField label="Total" value={order.total != null ? `$${Number(order.total).toLocaleString('es-AR')}` : '—'} />
        <DetailField label="Dirección" value={formatAddress(order.delivery_address ?? order.shipping_address)} />
        <DetailField label="Fecha" value={order.created_at ? new Date(order.created_at).toLocaleString('es-AR') : '—'} />
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

      {(order.status_history ?? []).length > 0 && (
        <div style={styles.itemsSection}>
          <div style={styles.itemsTitle}>Historial de estados</div>
          {(order.status_history ?? []).map((h, i) => (
            <div key={i} style={styles.historyRow}>
              <StatusBadge status={h.status} />
              <span style={styles.historyDate}>
                {h.changed_at ? new Date(h.changed_at).toLocaleString('es-AR') : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {(order.fulfillments ?? []).length > 0 && (
        <div style={styles.itemsSection}>
          <div style={styles.itemsTitle}>Vendedores</div>
          {(order.fulfillments ?? []).map((f, i) => (
            <div key={i} style={styles.fulfillmentRow}>
              <span style={styles.mono}>ID: {f.seller_id}</span>
              <StatusBadge status={f.status} />
              {f.tracking_code && (
                <span style={styles.trackingCode}>Seguimiento: {f.tracking_code}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Campo de detalle individual con etiqueta y valor.
 *
 * @param {{ label: string, value: any, mono?: boolean }} props
 * @param {string} props.label - Etiqueta del campo (ej: "Método de pago").
 * @param {*} props.value - Valor a mostrar; si es `null` o `undefined` se muestra `'—'`.
 * @param {boolean} [props.mono=false] - Si `true`, aplica fuente monoespaciada al valor (útil para IDs).
 * @returns {JSX.Element} Par etiqueta/valor apilados verticalmente.
 */
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

/**
 * Muestra un badge de color según el estado de una orden.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Estado de la orden (ej: `'pending'`, `'paid'`, `'cancelled'`, `'delivered'`).
 * @returns {JSX.Element} Badge coloreado con la etiqueta del estado en español.
 */
function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

/**
 * Muestra un badge de color según el estado de pago de una orden.
 *
 * Mapea `approved`, `pending` y `rejected` a etiquetas en español con colores semánticos.
 * Para valores desconocidos muestra el valor crudo con estilo neutro.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Estado de pago (ej: `'approved'`, `'pending'`, `'rejected'`).
 * @returns {JSX.Element} Badge coloreado con el estado de pago.
 */
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
  toolbar: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  toolbarRow: { display: 'flex', alignItems: 'center', gap: 12 },
  search: {
    flex: 1, height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 14px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  filterGroup: { display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 },
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

  itemsSection: { marginTop: 12 },
  itemsTitle: { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  itemRow: {
    display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0',
    borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textPrimary,
  },
  itemQty: { color: COLORS.textSecondary, minWidth: 30 },
  fulfillmentRow: {
    display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0',
    borderBottom: `1px solid ${COLORS.border}`, fontSize: 13,
  },
  trackingCode: { color: COLORS.textSecondary, fontSize: 12 },
  historyRow: {
    display: 'flex', gap: 12, alignItems: 'center', padding: '5px 0',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  historyDate: { fontSize: 12, color: COLORS.textSecondary },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 16, marginTop: 20,
  },
  pageBtn: {
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  pageBtnDisabled: {
    color: COLORS.textMuted, cursor: 'not-allowed', backgroundColor: '#f8fafc',
  },
  pageInfo: { fontSize: 13, color: COLORS.textSecondary },
}

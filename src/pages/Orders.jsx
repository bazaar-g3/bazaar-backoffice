import { useState, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/colors'
import ordersApi from '../api/ordersApi'
import { common } from '../styles/common'
import { ordersStyles } from '../styles/orders'

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
  pending_payment: { label: 'Pend. de pago', bg: COLORS.warningLight, color: COLORS.warning },
  confirmed: { label: 'Confirmada', bg: COLORS.infoLight, color: COLORS.info },
  in_preparation: { label: 'En preparación', bg: COLORS.infoLight, color: COLORS.info },
  shipped: { label: 'Enviada', bg: COLORS.primaryLight, color: COLORS.primary },
  delivered: { label: 'Entregada', bg: COLORS.successLight, color: COLORS.success },
  payment_rejected: { label: 'Pago rechazado', bg: COLORS.errorLight, color: COLORS.error },
}

/**
 * Página de visualización de órdenes del sistema para soporte técnico (solo lectura).
 *
 * Carga órdenes paginadas desde GET /orders/admin/all (20 por página). El filtro
 * por estado se resuelve server-side; la búsqueda por ID o usuario es client-side
 * sobre la página actual. Al expandir una fila se obtiene el detalle completo
 * desde GET /orders/admin/{id}, incluyendo ítems, vendedores e historial de estados.
 *
 * @returns {JSX.Element} Vista de listado de órdenes con filtros, paginación y detalle expandible.
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
      const res = await ordersApi.get('/orders/admin/all', { params })
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
    ordersApi.get(`/orders/admin/${expandedId}`)
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
          🔄 Actualizar
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
      {!error && <div style={styles.card}>
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
      </div>}

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
    pending: { label: 'Pendiente', bg: COLORS.warningLight, color: COLORS.warning },
    rejected: { label: 'Rechazado', bg: COLORS.errorLight, color: COLORS.error },
  }
  const s = map[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

const styles = { ...common, ...ordersStyles }

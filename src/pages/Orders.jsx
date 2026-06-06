import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ChevronUp, ChevronDown } from 'lucide-react'
import ordersApi from '../api/ordersApi'
import { ORDER_STATUS_CONFIG } from '../constants/statusLabels'
import OrderStatusBadge from '../components/Badges/OrderStatusBadge'
import PaymentBadge from '../components/Badges/PaymentBadge'
import OrderDetail from '../components/Modals/OrderDetail'
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
        <button style={{ ...styles.refreshBtn, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => fetchOrders(page, statusFilter)} disabled={loading}>
          <RefreshCw size={14} /> Actualizar
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
              {s === 'Todos' ? 'Todos' : (ORDER_STATUS_CONFIG[s]?.label ?? s)}
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
                        <OrderStatusBadge status={order.status} />
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
                        <span style={styles.expandIcon}>{expandedId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
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



const styles = { ...common, ...ordersStyles }

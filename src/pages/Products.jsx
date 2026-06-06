import { useState, useEffect, useCallback, useRef } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import catalogApi from '../api/catalogApi'
import StockBadge from '../components/Badges/StockBadge'
import ProductStatusBadge from '../components/Badges/ProductStatusBadge'
import { common } from '../styles/common'
import { productsStyles } from '../styles/products'

const PAGE_SIZE = 20

/**
 * Opciones de filtro de estado para el panel de moderación.
 * Cada opción mapea a parámetros de query que se envían a GET /products/admin/.
 */
const STATUS_FILTERS = [
  { value: 'all',           label: 'Todos' },
  { value: 'active',        label: 'Activos' },
  { value: 'disabled',      label: 'Deshabilitados por vendedor' },
  { value: 'admin_disabled',label: 'Bloqueados por admin' },
]

/**
 * Construye los parámetros de query para el endpoint de admin products.
 *
 * @param {Object} opts
 * @param {string} opts.search - Término de búsqueda (puede estar vacío).
 * @param {string} opts.statusFilter - Valor de filtro seleccionado.
 * @param {number} opts.page - Página actual (1-based).
 * @returns {string} Query string para la URL.
 */
function buildQuery({ search, statusFilter, page }) {
  const params = new URLSearchParams()
  params.set('limit', String(PAGE_SIZE))
  params.set('offset', String((page - 1) * PAGE_SIZE))
  if (search) params.set('search', search)
  if (statusFilter === 'active') {
    params.set('status', 'active')
    params.set('adminDisabled', 'false')
  } else if (statusFilter === 'disabled') {
    params.set('status', 'disabled')
    params.set('adminDisabled', 'false')
  } else if (statusFilter === 'admin_disabled') {
    params.set('adminDisabled', 'true')
  }
  return params.toString()
}

/**
 * Página de moderación de productos del panel de administración.
 *
 * Muestra un listado paginado de TODOS los productos de la plataforma (activos,
 * deshabilitados y sin stock). Permite al administrador:
 * - Buscar por nombre o descripción con debounce de 400 ms.
 * - Filtrar por estado (activos / deshabilitados por vendedor / bloqueados por admin).
 * - Ver el detalle completo de un producto, incluido historial de estados e info del vendedor.
 * - Deshabilitar o rehabilitar un producto administrativamente con confirmación.
 *
 * @returns {JSX.Element} Vista de moderación con tabla paginada y modales.
 */
export default function Products() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmModerate, setConfirmModerate] = useState(null) // { product, newAdminDisabled }
  const [selectedProduct, setSelectedProduct] = useState(null) // producto para el modal de detalle
  const debounceTimer = useRef(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function handleSearchChange(value) {
    setSearch(value)
    setPage(1)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 400)
  }

  function handleFilterChange(value) {
    setStatusFilter(value)
    setPage(1)
  }

  /**
   * Obtiene la lista paginada de productos desde el endpoint de administración.
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = buildQuery({ search: debouncedSearch, statusFilter, page })
      const res = await catalogApi.get(`/products/admin/?${qs}`)
      const data = res.data
      setProducts(Array.isArray(data) ? data : data.products ?? [])
      setTotal(typeof data.total === 'number' ? data.total : 0)
    } catch {
      setError('No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  /**
   * Ejecuta la acción de moderación (deshabilitar o rehabilitar) sobre un producto.
   * Actualiza el elemento en la lista local para evitar un refetch completo.
   *
   * @param {{ product: Object, newAdminDisabled: boolean }} target - Objetivo confirmado.
   */
  async function moderateProduct({ product, newAdminDisabled }) {
    setActionLoading(product.id)
    try {
      const res = await catalogApi.patch(`/products/admin/${product.id}/moderation`, {
        adminDisabled: newAdminDisabled,
      })
      const updated = res.data?.product ?? res.data
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updated } : p))
      // Si el modal de detalle estaba abierto para este producto, actualizar también
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(prev => ({ ...prev, ...updated }))
      }
      setConfirmModerate(null)
    } catch {
      alert('No se pudo actualizar el estado del producto. Intentá de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={styles.page}>
      {/* Modal de confirmación de moderación */}
      {confirmModerate && (
        <ConfirmModerationModal
          product={confirmModerate.product}
          newAdminDisabled={confirmModerate.newAdminDisabled}
          loading={actionLoading === confirmModerate.product.id}
          onConfirm={() => moderateProduct(confirmModerate)}
          onCancel={() => setConfirmModerate(null)}
        />
      )}

      {/* Modal de detalle de producto */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onModerate={(newAdminDisabled) => {
            setSelectedProduct(null)
            setConfirmModerate({ product: selectedProduct, newAdminDisabled })
          }}
          actionLoading={actionLoading === selectedProduct.id}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Moderación de Productos</h1>
          <p style={styles.subtitle}>Listado completo de productos · Podés deshabilitar o rehabilitar cualquier publicación</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchProducts} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* Búsqueda */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          type="text"
          placeholder="Buscar por nombre o descripción…"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <span style={styles.count}>
          {loading ? '…' : `${total} producto${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filtros de estado */}
      <div style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            style={{
              ...styles.filterPill,
              ...(statusFilter === f.value ? styles.filterPillActive : {}),
            }}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Tabla */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.center}>Cargando productos…</div>
        ) : products.length === 0 ? (
          <div style={styles.center}>No se encontraron productos con los filtros aplicados.</div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['', 'ID', 'Producto', 'Vendedor', 'Precio', 'Stock', 'Estado', 'Publicado', 'Acciones'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr
                      key={product.id}
                      style={{ ...styles.tr, cursor: 'pointer' }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      {/* Thumbnail */}
                      <td style={{ ...styles.td, width: 52 }} onClick={e => e.stopPropagation()}>
                        <ProductThumb src={product.images?.[0]} name={product.name} />
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mono}>#{String(product.id ?? '').slice(0, 8)}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.productName}>{product.name ?? '—'}</div>
                        {product.category?.label && (
                          <div style={styles.productCategory}>{product.category.label}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mono}>{product.sellerId ?? '—'}</span>
                      </td>
                      <td style={styles.td}>
                        ${(product.price ?? 0).toLocaleString('es-AR')}
                      </td>
                      <td style={styles.td}>
                        <StockBadge stock={product.stock} />
                      </td>
                      <td style={styles.td}>
                        <ProductStatusBadge product={product} />
                      </td>
                      <td style={styles.td}>
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                      <td style={styles.td} onClick={e => e.stopPropagation()}>
                        {product.adminDisabled ? (
                          <button
                            style={{ ...styles.enableBtn, opacity: actionLoading === product.id ? 0.6 : 1 }}
                            onClick={() => setConfirmModerate({ product, newAdminDisabled: false })}
                            disabled={actionLoading !== null}
                          >
                            Rehabilitar
                          </button>
                        ) : (
                          <button
                            style={{ ...styles.disableBtn, opacity: actionLoading === product.id ? 0.6 : 1 }}
                            onClick={() => setConfirmModerate({ product, newAdminDisabled: true })}
                            disabled={actionLoading !== null}
                          >
                            Deshabilitar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

/**
 * Miniatura de imagen del producto con fallback al ícono 📦.
 */
function ProductThumb({ src, name }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }}
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8,
      backgroundColor: COLORS.border, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 18,
    }}>
      📦
    </div>
  )
}


/**
 * Controles de paginación: anterior, números de página y siguiente.
 */
function Pagination({ page, totalPages, onPageChange }) {
  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)

  return (
    <div style={styles.pagination}>
      <button
        style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        ‹
      </button>
      {pages.map(p => (
        <button
          key={p}
          style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        style={{ ...styles.pageBtn, ...(page === totalPages ? styles.pageBtnDisabled : {}) }}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        ›
      </button>
    </div>
  )
}

/**
 * Modal de confirmación para la acción de moderación (deshabilitar / rehabilitar).
 */
function ConfirmModerationModal({ product, newAdminDisabled, loading, onConfirm, onCancel }) {
  const name = product.name ?? `#${product.id}`
  const action = newAdminDisabled ? 'deshabilitar' : 'rehabilitar'
  const actionLabel = newAdminDisabled ? 'Sí, deshabilitar' : 'Sí, rehabilitar'
  const icon = newAdminDisabled ? '🚫' : '✅'

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalIcon}>{icon}</div>
        <h3 style={styles.modalTitle}>¿{action.charAt(0).toUpperCase() + action.slice(1)} producto?</h3>
        <p style={styles.modalText}>
          Estás por <strong>{action}</strong> el producto <strong>{name}</strong>.
          {newAdminDisabled
            ? ' El vendedor no podrá reactivarlo hasta que vos lo rehabilites.'
            : ' El producto volverá a comportarse según el estado del vendedor.'}
        </p>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            style={{
              ...(newAdminDisabled ? styles.confirmBtn : styles.confirmEnableBtn),
              opacity: loading ? 0.6 : 1,
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Guardando…' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modal de detalle completo de un producto.
 *
 * Carga la información del vendedor llamando a GET /users/{sellerId} al montarse.
 * Muestra todos los datos del producto, el estado de moderación y el historial
 * cronológico de cambios de estado.
 *
 * @param {{ product: Object, onClose: () => void, onModerate: (boolean) => void, actionLoading: boolean }} props
 */
function ProductDetailModal({ product, onClose, onModerate, actionLoading }) {
  const [seller, setSeller] = useState(null)
  const [sellerLoading, setSellerLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchSeller() {
      setSellerLoading(true)
      try {
        const res = await api.get(`/users/${product.sellerId}/profile`)
        if (!cancelled) setSeller(res.data)
      } catch {
        if (!cancelled) setSeller(null)
      } finally {
        if (!cancelled) setSellerLoading(false)
      }
    }
    fetchSeller()
    return () => { cancelled = true }
  }, [product.sellerId])

  const mainImage = product.images?.[0]
  const history = [...(product.statusHistory ?? [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  const sourceLabel = { system: 'Sistema', seller: 'Vendedor', admin: 'Administrador' }
  const statusLabel = {
    active:         'Habilitado',
    disabled:       'Deshabilitado',
    admin_disabled: 'Bloqueado por admin',
    admin_enabled:  'Rehabilitado por admin',
  }

  const sellerName = seller?.fullName ?? null
  const sellerEmail = seller?.email ?? null

  return (
    <div style={styles.detailOverlay} onClick={onClose}>
      <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
        {/* Encabezado */}
        <div style={styles.detailHeader}>
          <h2 style={styles.detailTitle}>{product.name ?? 'Detalle de producto'}</h2>
          <button style={styles.detailClose} onClick={onClose}>×</button>
        </div>

        {/* Imagen principal */}
        {mainImage && (
          <img
            src={mainImage}
            alt={product.name}
            style={styles.detailImg}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

        {/* Grilla de datos */}
        <div style={styles.detailGrid}>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>ID</div>
            <div style={{ ...styles.detailValue, fontFamily: 'monospace', fontSize: 12 }}>{product.id}</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Categoría</div>
            <div style={styles.detailValue}>{product.category?.label ?? '—'}</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Precio</div>
            <div style={styles.detailValue}>${(product.price ?? 0).toLocaleString('es-AR')}</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Stock</div>
            <div style={styles.detailValue}>{product.stock ?? '—'} unidades</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Estado del vendedor</div>
            <div style={styles.detailValue}>{product.status === 'active' ? 'Activo' : 'Deshabilitado'}</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Moderación admin</div>
            <div style={{ ...styles.detailValue, color: product.adminDisabled ? COLORS.warning : COLORS.success, fontWeight: 700 }}>
              {product.adminDisabled ? 'Bloqueado' : 'Sin restricciones'}
            </div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Publicado</div>
            <div style={styles.detailValue}>{product.createdAt ? new Date(product.createdAt).toLocaleDateString('es-AR') : '—'}</div>
          </div>
          <div style={styles.detailCell}>
            <div style={styles.detailLabel}>Última actualización</div>
            <div style={styles.detailValue}>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('es-AR') : '—'}</div>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <div style={styles.detailLabel}>Descripción</div>
          <div style={{ ...styles.detailValue, marginTop: 4, lineHeight: 1.5, color: COLORS.textSecondary }}>
            {product.description ?? '—'}
          </div>
        </div>

        {/* Vendedor */}
        <div style={styles.detailSection}>Vendedor</div>
        {sellerLoading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Cargando datos del vendedor…</div>
        ) : (
          <div style={styles.detailGrid}>
            <div style={styles.detailCell}>
              <div style={styles.detailLabel}>ID</div>
              <div style={{ ...styles.detailValue, fontFamily: 'monospace' }}>{product.sellerId}</div>
            </div>
            <div style={styles.detailCell}>
              <div style={styles.detailLabel}>Nombre</div>
              <div style={styles.detailValue}>{sellerName ?? <span style={{ color: COLORS.textMuted }}>No disponible</span>}</div>
            </div>
            {sellerEmail && (
              <div style={styles.detailCell}>
                <div style={styles.detailLabel}>Email</div>
                <div style={styles.detailValue}>{sellerEmail}</div>
              </div>
            )}
          </div>
        )}

        {/* Historial de estados */}
        <div style={styles.detailSection}>Historial de estados</div>
        {history.length === 0 ? (
          <div style={styles.historyEmpty}>Sin historial registrado.</div>
        ) : (
          <table style={styles.historyTable}>
            <thead>
              <tr>
                <th style={styles.historyTh}>Estado</th>
                <th style={styles.historyTh}>Origen</th>
                <th style={styles.historyTh}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => (
                <tr key={i}>
                  <td style={styles.historyTd}>{statusLabel[entry.status] ?? entry.status}</td>
                  <td style={styles.historyTd}>{sourceLabel[entry.source] ?? entry.source}</td>
                  <td style={styles.historyTd}>
                    {entry.timestamp
                      ? new Date(entry.timestamp).toLocaleString('es-AR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Acción de moderación */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={styles.cancelBtn} onClick={onClose}>Cerrar</button>
          {product.adminDisabled ? (
            <button
              style={{ ...styles.confirmEnableBtn, opacity: actionLoading ? 0.6 : 1 }}
              onClick={() => onModerate(false)}
              disabled={actionLoading}
            >
              Rehabilitar producto
            </button>
          ) : (
            <button
              style={{ ...styles.confirmBtn, opacity: actionLoading ? 0.6 : 1 }}
              onClick={() => onModerate(true)}
              disabled={actionLoading}
            >
              Deshabilitar producto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = { ...common, ...productsStyles }

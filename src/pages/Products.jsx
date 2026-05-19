import { useState, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'

/**
 * Página de moderación de productos del panel de administración.
 *
 * Carga todos los productos del catálogo desde GET /products/ al montar el componente
 * y aplica un filtro de búsqueda en el cliente (sin paginación server-side).
 * La búsqueda compara contra nombre, descripción, ID y vendedor del producto.
 *
 * La eliminación de un producto requiere confirmación explícita del administrador
 * mediante un modal de confirmación antes de ejecutar DELETE /products/:id.
 * Al confirmarse, el producto se elimina de la lista local sin recargar todos los datos.
 *
 * @returns {JSX.Element} Vista de moderación con tabla de productos y modal de confirmación.
 */
export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // product to confirm deletion

  /**
   * Obtiene la lista de productos desde el endpoint de catálogo.
   *
   * Normaliza la respuesta para manejar tanto arrays directos como objetos
   * con propiedad `products` (por compatibilidad con distintas versiones del API).
   * Es un callback memoizado sin dependencias, reutilizable como manejador del botón "Actualizar".
   *
   * @async
   * @returns {Promise<void>}
   */
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/products/')
      const data = res.data
      setProducts(Array.isArray(data) ? data : data.products ?? [])
    } catch {
      setError('No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  /**
   * Elimina un producto del sistema previa confirmación del administrador.
   *
   * Llama a DELETE /products/:id. Si tiene éxito, elimina el producto del estado local
   * para evitar un refetch completo, y cierra el modal de confirmación.
   * Si falla, muestra un `alert` nativo con un mensaje de error.
   * Durante la operación, marca el producto como "en carga" para deshabilitar los botones del modal.
   *
   * @async
   * @param {{ id: number|string, name?: string, title?: string }} product - Producto a eliminar.
   * @returns {Promise<void>}
   */
  async function deleteProduct(product) {
    setActionLoading(product.id)
    try {
      await api.delete(`/products/${product.id}`)
      setProducts(prev => prev.filter(p => p.id !== product.id))
      setConfirmDelete(null)
    } catch {
      alert('No se pudo eliminar el producto. Intentá de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Lista de productos filtrada por el término de búsqueda, calculada de forma derivada.
   * La búsqueda es case-insensitive y compara contra nombre, descripción, ID y seller_id del producto.
   *
   * @type {Array<Object>}
   */
  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return (
      (p.name ?? p.title ?? '').toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q) ||
      String(p.id ?? '').includes(q) ||
      (p.seller_id ?? p.user_id ?? '').toString().includes(q)
    )
  })

  return (
    <div style={styles.page}>
      {/* Confirm modal */}
      {confirmDelete && (
        <ConfirmModal
          product={confirmDelete}
          loading={actionLoading === confirmDelete.id}
          onConfirm={() => deleteProduct(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Moderación de Productos</h1>
          <p style={styles.subtitle}>Revisá y eliminá productos que incumplan las reglas</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchProducts} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* Search */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          type="text"
          placeholder="Buscar por nombre, descripción, ID o vendedor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={styles.count}>
          {loading ? '…' : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.center}>Cargando productos…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.center}>No se encontraron productos.</div>
        ) : (
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
                {filtered.map(product => (
                  <tr key={product.id} style={styles.tr}>
                    {/* Thumbnail */}
                    <td style={{ ...styles.td, width: 52 }}>
                      <ProductThumb src={product.image_url ?? product.images?.[0]} name={product.name ?? product.title} />
                    </td>
                    <td style={styles.td}>
                      <span style={styles.mono}>#{String(product.id ?? '').slice(0, 8)}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productName}>{product.name ?? product.title ?? '—'}</div>
                      {product.category && (
                        <div style={styles.productCategory}>{product.category}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.mono}>{String(product.seller_id ?? product.user_id ?? '—').slice(0, 8)}</span>
                    </td>
                    <td style={styles.td}>
                      ${(product.price ?? 0).toLocaleString('es-AR')}
                    </td>
                    <td style={styles.td}>
                      <StockBadge stock={product.stock ?? product.quantity} />
                    </td>
                    <td style={styles.td}>
                      <ProductStatusBadge status={product.status ?? (product.is_active ? 'active' : 'inactive')} />
                    </td>
                    <td style={styles.td}>
                      {product.created_at
                        ? new Date(product.created_at).toLocaleDateString('es-AR')
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.deleteBtn, opacity: actionLoading === product.id ? 0.6 : 1 }}
                        onClick={() => setConfirmDelete(product)}
                        disabled={actionLoading !== null}
                      >
                        🗑️ Eliminar
                      </button>
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

/**
 * Muestra la imagen miniatura de un producto.
 *
 * Si hay URL de imagen, renderiza un `<img>` con `object-fit: cover` y oculta
 * el elemento si la imagen falla al cargar (via `onError`).
 * Si no hay URL, muestra un placeholder con el ícono 📦.
 *
 * @param {{ src?: string, name?: string }} props
 * @param {string} [props.src] - URL de la imagen del producto.
 * @param {string} [props.name] - Nombre del producto (usado como `alt` text).
 * @returns {JSX.Element} Imagen del producto o placeholder gris.
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
 * Muestra el stock de un producto con indicadores visuales según criticidad.
 *
 * - Sin stock (0): badge rojo "Sin stock".
 * - Stock bajo (<5): badge amarillo con la cantidad.
 * - Stock normal (≥5): texto gris simple con la cantidad.
 * - Sin dato (null/undefined): guión gris.
 *
 * @param {{ stock: number|null|undefined }} props
 * @param {number|null|undefined} props.stock - Cantidad de unidades disponibles.
 * @returns {JSX.Element} Indicador visual del nivel de stock.
 */
function StockBadge({ stock }) {
  if (stock == null) return <span style={{ color: COLORS.textMuted }}>—</span>
  if (stock === 0)
    return <span style={{ ...styles.badge, backgroundColor: COLORS.errorLight, color: COLORS.error }}>Sin stock</span>
  if (stock < 5)
    return <span style={{ ...styles.badge, backgroundColor: COLORS.warningLight, color: COLORS.warning }}>{stock} uds</span>
  return <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{stock} uds</span>
}

/**
 * Muestra un badge de color según el estado de publicación de un producto.
 *
 * Mapea los estados `active`, `inactive`, `reported` y `paused` a etiquetas en español
 * con colores semánticos. Para valores desconocidos muestra el valor crudo con estilo neutro.
 *
 * @param {{ status: string }} props
 * @param {string} props.status - Estado del producto (ej: `'active'`, `'reported'`).
 * @returns {JSX.Element} Badge coloreado con el estado del producto.
 */
function ProductStatusBadge({ status }) {
  const map = {
    active:   { label: 'Activo',    bg: COLORS.successLight, color: COLORS.success },
    inactive: { label: 'Inactivo',  bg: '#f1f5f9',           color: COLORS.textSecondary },
    reported: { label: 'Reportado', bg: COLORS.errorLight,   color: COLORS.error   },
    paused:   { label: 'Pausado',   bg: COLORS.warningLight, color: COLORS.warning },
  }
  const s = map[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

/**
 * Modal de confirmación para la eliminación de un producto.
 *
 * Se renderiza como overlay de pantalla completa con fondo oscuro semitransparente.
 * Muestra el nombre del producto a eliminar y dos botones: cancelar o confirmar.
 * Ambos botones se deshabilitan durante el proceso de eliminación (`loading`).
 *
 * @param {{ product: Object, loading: boolean, onConfirm: () => void, onCancel: () => void }} props
 * @param {Object} props.product - Producto que se quiere eliminar (debe tener `name`, `title` o `id`).
 * @param {boolean} props.loading - `true` mientras se ejecuta el DELETE; deshabilita los botones.
 * @param {() => void} props.onConfirm - Callback ejecutado al confirmar la eliminación.
 * @param {() => void} props.onCancel - Callback ejecutado al cancelar (cierra el modal).
 * @returns {JSX.Element} Modal de confirmación con overlay.
 */
function ConfirmModal({ product, loading, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalIcon}>🗑️</div>
        <h3 style={styles.modalTitle}>¿Eliminar producto?</h3>
        <p style={styles.modalText}>
          Estás por eliminar <strong>{product.name ?? product.title ?? `#${product.id}`}</strong>.
          Esta acción no se puede deshacer.
        </p>
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            style={{ ...styles.confirmBtn, opacity: loading ? 0.6 : 1 }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
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
  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search: {
    flex: 1, height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 14px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
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
  td: { padding: '10px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  productName: { fontWeight: 600, color: COLORS.textPrimary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productCategory: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  deleteBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    backgroundColor: COLORS.errorLight, color: COLORS.error,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },

  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  modal: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: '32px 36px',
    maxWidth: 420, width: '90%', textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  modalIcon: { fontSize: 40, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, margin: '0 0 10px' },
  modalText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.5, margin: '0 0 24px' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancelBtn: {
    padding: '10px 22px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    backgroundColor: COLORS.error, color: COLORS.white, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
}

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import api from '../../api/api'
import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'
import { productsStyles } from '../../styles/products'

const styles = { ...common, ...productsStyles }

/**
 * Modal de detalle completo de un producto.
 *
 * Carga la información del vendedor llamando a GET /users/{sellerId} al montarse.
 * Muestra todos los datos del producto, el estado de moderación y el historial
 * cronológico de cambios de estado.
 *
 * @param {{ product: object, onClose: () => void, onModerate: (boolean) => void, actionLoading: boolean }} props
 */
export default function ProductDetailModal({ product, onClose, onModerate, actionLoading }) {
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

  return (
    <div style={styles.detailOverlay} onClick={onClose}>
      <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
        <div style={styles.detailHeader}>
          <h2 style={styles.detailTitle}>{product.name ?? 'Detalle de producto'}</h2>
          <button style={styles.detailClose} onClick={onClose}><X size={18} /></button>
        </div>

        {mainImage && (
          <img
            src={mainImage}
            alt={product.name}
            style={styles.detailImg}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}

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

        <div>
          <div style={styles.detailLabel}>Descripción</div>
          <div style={{ ...styles.detailValue, marginTop: 4, lineHeight: 1.5, color: COLORS.textSecondary }}>
            {product.description ?? '—'}
          </div>
        </div>

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
              <div style={styles.detailValue}>
                {seller?.fullName ?? <span style={{ color: COLORS.textMuted }}>No disponible</span>}
              </div>
            </div>
            {seller?.email && (
              <div style={styles.detailCell}>
                <div style={styles.detailLabel}>Email</div>
                <div style={styles.detailValue}>{seller.email}</div>
              </div>
            )}
          </div>
        )}

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
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleString('es-AR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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

import OrderStatusBadge from '../Badges/OrderStatusBadge'
import { common } from '../../styles/common'
import { ordersStyles } from '../../styles/orders'

const styles = { ...common, ...ordersStyles }

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
 * Panel de detalle de una orden, mostrado como fila expandida en la tabla.
 *
 * @param {{ order: object }} props
 */
export default function OrderDetail({ order }) {
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
              <OrderStatusBadge status={h.status} />
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
              <OrderStatusBadge status={f.status} />
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

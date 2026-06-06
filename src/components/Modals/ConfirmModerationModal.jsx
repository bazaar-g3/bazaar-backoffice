import { Ban, CheckCircle } from 'lucide-react'
import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'
import { productsStyles } from '../../styles/products'

const styles = { ...common, ...productsStyles }

/**
 * Modal de confirmación para la acción de moderación (deshabilitar / rehabilitar).
 *
 * @param {{ product: object, newAdminDisabled: boolean, loading: boolean, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmModerationModal({ product, newAdminDisabled, loading, onConfirm, onCancel }) {
  const name = product.name ?? `#${product.id}`
  const action = newAdminDisabled ? 'deshabilitar' : 'rehabilitar'
  const actionLabel = newAdminDisabled ? 'Sí, deshabilitar' : 'Sí, rehabilitar'
  const Icon = newAdminDisabled ? Ban : CheckCircle
  const iconColor = newAdminDisabled ? COLORS.error : COLORS.success

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={{ ...styles.modalIcon, color: iconColor }}><Icon size={32} /></div>
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
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Guardando…' : <><Icon size={14} /> {actionLabel}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

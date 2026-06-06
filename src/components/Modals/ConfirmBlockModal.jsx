import { AlertTriangle, Ban } from 'lucide-react'
import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'
import { usersStyles } from '../../styles/users'

const styles = { ...common, ...usersStyles }

/**
 * Modal de confirmación de bloqueo centrado en pantalla con overlay oscuro.
 *
 * @param {{ user: object, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmBlockModal({ user, onConfirm, onCancel }) {
  const displayName = user.fullName ?? user.email ?? `Usuario #${user.id}`

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalWarningIcon}><AlertTriangle size={32} /></div>

        <h2 style={styles.modalTitle}>¡Atención!</h2>

        <p style={styles.modalBody}>
          Estás a punto de bloquear la cuenta de{' '}
          <strong style={{ color: COLORS.textPrimary }}>{displayName}</strong>.
        </p>
        <p style={styles.modalSubtext}>
          El usuario no podrá iniciar sesión y sus productos serán ocultados del catálogo.
        </p>
        <p style={styles.modalQuestion}>¿Estás seguro?</p>

        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button
            style={{ ...styles.confirmBtn, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={onConfirm}
          >
            <Ban size={14} /> Bloquear
          </button>
        </div>
      </div>
    </div>
  )
}

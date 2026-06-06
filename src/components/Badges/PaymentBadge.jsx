import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'

const PAYMENT_STATUS_CONFIG = {
  approved: { label: 'Aprobado',  bg: COLORS.successLight, color: COLORS.success },
  pending:  { label: 'Pendiente', bg: COLORS.warningLight, color: COLORS.warning },
  rejected: { label: 'Rechazado', bg: COLORS.errorLight,   color: COLORS.error   },
}

/**
 * Badge de color según el estado de pago de una orden.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function PaymentBadge({ status }) {
  const s = PAYMENT_STATUS_CONFIG[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...common.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

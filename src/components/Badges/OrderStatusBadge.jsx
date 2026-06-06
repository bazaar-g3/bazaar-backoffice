import { COLORS } from '../../constants/colors'
import { ORDER_STATUS_CONFIG } from '../../constants/statusLabels'
import { common } from '../../styles/common'

/**
 * Badge de color según el estado de una orden.
 *
 * @param {{ status: string }} props
 * @returns {JSX.Element}
 */
export default function OrderStatusBadge({ status }) {
  const s = ORDER_STATUS_CONFIG[status] ?? { label: status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...common.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

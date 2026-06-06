import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'

const PRODUCT_STATUS_CONFIG = {
  active:   { label: 'Activo',   bg: COLORS.successLight, color: COLORS.success       },
  disabled: { label: 'Inactivo', bg: '#f1f5f9',           color: COLORS.textSecondary },
}

/**
 * Badge de estado del producto. Prioriza el flag `adminDisabled` sobre el estado del vendedor.
 *
 * @param {{ product: { status: string, adminDisabled: boolean } }} props
 * @returns {JSX.Element}
 */
export default function ProductStatusBadge({ product }) {
  if (product.adminDisabled) {
    return <span style={{ ...common.badge, backgroundColor: COLORS.warningLight, color: COLORS.warning }}>Bloqueado admin</span>
  }
  const s = PRODUCT_STATUS_CONFIG[product.status] ?? { label: product.status ?? '—', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...common.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'

/**
 * Badge de stock con indicadores visuales por nivel de criticidad.
 * Sin stock → rojo, menos de 5 → amarillo, con stock → texto neutro.
 *
 * @param {{ stock: number | null }} props
 * @returns {JSX.Element}
 */
export default function StockBadge({ stock }) {
  if (stock == null) return <span style={{ color: COLORS.textMuted }}>—</span>
  if (stock === 0)
    return <span style={{ ...common.badge, backgroundColor: COLORS.errorLight, color: COLORS.error }}>Sin stock</span>
  if (stock < 5)
    return <span style={{ ...common.badge, backgroundColor: COLORS.warningLight, color: COLORS.warning }}>{stock} uds</span>
  return <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{stock} uds</span>
}

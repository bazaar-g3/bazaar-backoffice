import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'

/**
 * Badge que indica si un usuario es administrador o usuario regular.
 *
 * @param {{ isAdmin: boolean }} props
 * @returns {JSX.Element}
 */
export default function RoleBadge({ isAdmin }) {
  return isAdmin
    ? <span style={{ ...common.badge, backgroundColor: COLORS.primaryLight, color: COLORS.primary }}>Admin</span>
    : <span style={{ ...common.badge, backgroundColor: '#f1f5f9', color: COLORS.textSecondary }}>Usuario</span>
}

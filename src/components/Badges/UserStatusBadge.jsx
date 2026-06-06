import { COLORS } from '../../constants/colors'
import { common } from '../../styles/common'

/**
 * Badge que indica si un usuario está bloqueado o activo.
 *
 * @param {{ blocked: boolean }} props
 * @returns {JSX.Element}
 */
export default function UserStatusBadge({ blocked }) {
  return blocked
    ? <span style={{ ...common.badge, backgroundColor: COLORS.errorLight, color: COLORS.error }}>Bloqueado</span>
    : <span style={{ ...common.badge, backgroundColor: COLORS.successLight, color: COLORS.success }}>Activo</span>
}

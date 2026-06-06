import { useState, useEffect, useCallback, useRef } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'
import { common } from '../styles/common'
import { usersStyles } from '../styles/users'
import { parseJwtPayload } from '../utils/jwt'

/** Cantidad de usuarios por página en el listado. */
const PAGE_SIZE = 20

/**
 * Obtiene el ID del admin autenticado desde el token JWT del localStorage.
 * Se usa para deshabilitar el botón de bloqueo en la propia fila del admin (CA4).
 *
 * @returns {number | null} ID numérico del admin autenticado, o null si no hay token válido.
 */
function getAuthenticatedAdminId() {
  const token = localStorage.getItem('token')
  if (!token) return null
  const payload = parseJwtPayload(token)
  return payload?.sub ? parseInt(payload.sub, 10) : null
}

/**
 * Opciones disponibles para el filtro de rol.
 * El valor vacío `''` representa "sin filtro" (muestra todos los usuarios).
 *
 * @type {Array<{ value: string, label: string }>}
 */
const ROLE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'user', label: 'Usuarios' },
  { value: 'admin', label: 'Admins' },
]

/**
 * Página de gestión de usuarios del panel de administración.
 *
 * Presenta una tabla paginada de todos los usuarios registrados en el sistema,
 * con las siguientes capacidades:
 * - Búsqueda por nombre o email con debounce de 400 ms para evitar llamadas excesivas a la API.
 * - Filtro de rol (Todos / Usuarios / Admins) mediante pills de selección.
 * - Acciones de bloqueo y desbloqueo por usuario (con protección para no bloquear admins).
 * - Modal de confirmación antes de bloquear un usuario regular.
 * - Tooltip informativo al hacer hover sobre el botón deshabilitado de filas de admin.
 * - Toast de advertencia auto-descartable cuando se intenta bloquear un administrador.
 * - Paginación con ellipsis para conjuntos grandes de páginas.
 *
 * La búsqueda y el filtro se procesan en el servidor. Al cambiar cualquier filtro se resetea
 * la página a 1 para evitar mostrar una página vacía.
 *
 * @returns {JSX.Element} Vista completa de gestión de usuarios con tabla, filtros y paginación.
 */
export default function Users() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [warning, setWarning] = useState('')
  /** Usuario pendiente de confirmación de bloqueo. `null` cuando el modal está cerrado. */
  const [confirmTarget, setConfirmTarget] = useState(null)
  const debounceTimer = useRef(null)
  const warningTimer = useRef(null)
  // ID del admin autenticado — se usa para deshabilitar el botón de bloqueo en la propia fila (CA4)
  const currentAdminId = getAuthenticatedAdminId()

  /**
   * Maneja cambios en el campo de búsqueda con debounce de 400 ms.
   *
   * Actualiza inmediatamente el valor visible del input (`search`) y resetea la página a 1.
   * La búsqueda efectiva contra la API (`debouncedSearch`) se actualiza solo 400 ms
   * después de que el usuario deja de escribir, evitando requests innecesarios.
   *
   * @param {string} value - Nuevo valor del campo de búsqueda.
   */
  function handleSearchChange(value) {
    setSearch(value)
    setPage(1)
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 400)
  }

  /**
   * Actualiza el filtro de rol activo y resetea la paginación a la primera página.
   *
   * @param {string} value - Valor del filtro seleccionado: `''` (todos), `'user'` o `'admin'`.
   */
  function handleRoleChange(value) {
    setRoleFilter(value)
    setPage(1)
  }

  /**
   * Muestra un toast de advertencia en la parte superior de la pantalla.
   *
   * El toast se descarta automáticamente después de 3.5 segundos.
   * Reinicia el timer si ya había una advertencia visible para evitar
   * que desaparezca antes de que el usuario pueda leerla.
   *
   * @param {string} msg - Mensaje de advertencia a mostrar.
   */
  function showWarning(msg) {
    setWarning(msg)
    clearTimeout(warningTimer.current)
    warningTimer.current = setTimeout(() => setWarning(''), 3500)
  }

  /**
   * Obtiene la lista paginada de usuarios desde la API.
   *
   * Construye los query params con la página actual, el límite, la búsqueda (si hay)
   * y el filtro de rol (si hay), y llama a GET /users/.
   * Es un callback memoizado que se regenera solo cuando cambian `page`, `debouncedSearch` o `roleFilter`.
   *
   * @async
   * @returns {Promise<void>}
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page, limit: PAGE_SIZE })
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (roleFilter) params.set('role', roleFilter)

      const res = await api.get(`/users/?${params}`)
      setUsers(res.data.users ?? [])
      setTotal(res.data.total ?? 0)
      setTotalPages(res.data.totalPages ?? 1)
    } catch {
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  /**
   * Ejecuta la llamada a la API para bloquear o desbloquear un usuario
   * y actualiza el estado local sin recargar toda la lista.
   *
   * @async
   * @param {{ id: number, isBlocked: boolean }} user - Usuario a modificar.
   * @returns {Promise<void>}
   */
  async function executeToggleBlock(user) {
    const endpoint = user.isBlocked ? `/users/${user.id}/unblock` : `/users/${user.id}/block`
    setActionLoading(user.id)
    try {
      await api.patch(endpoint)
      setUsers(prev =>
        prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u)
      )
    } catch {
      alert('No se pudo realizar la acción. Intentá de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Alterna el estado de bloqueo de un usuario (bloquear ↔ desbloquear).
   *
   * - Si el usuario es administrador → muestra toast de advertencia y retorna.
   * - Si el usuario es la propia cuenta del admin → muestra toast y retorna.
   * - Si la acción es bloquear → abre el modal de confirmación.
   * - Si la acción es desbloquear → ejecuta directamente sin confirmación.
   *
   * @param {{ id: number, isAdmin: boolean, isBlocked: boolean }} user - Usuario a modificar.
   */
  function toggleBlock(user) {
    if (user.isAdmin) {
      showWarning('No podés bloquear a otro administrador del sistema.')
      return
    }
    if (user.id === currentAdminId) {
      showWarning('No podés bloquear tu propia cuenta.')
      return
    }
    if (!user.isBlocked) {
      // Bloquear requiere confirmación explícita
      setConfirmTarget(user)
      return
    }
    // Desbloquear es una acción de baja consecuencia, no requiere confirmación
    executeToggleBlock(user)
  }

  /**
   * Confirma el bloqueo del usuario pendiente y cierra el modal.
   * Llamado desde el botón "Bloquear" del modal de confirmación.
   */
  async function handleConfirmBlock() {
    const user = confirmTarget
    setConfirmTarget(null)
    await executeToggleBlock(user)
  }

  return (
    <div style={styles.page}>

      {/* Modal de confirmación de bloqueo */}
      {confirmTarget && (
        <ConfirmBlockModal
          user={confirmTarget}
          onConfirm={handleConfirmBlock}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Warning toast */}
      {warning && (
        <div style={styles.warningToast}>
          ⚠️ {warning}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Usuarios</h1>
          <p style={styles.subtitle}>Gestión de cuentas registradas</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchUsers} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* Toolbar: búsqueda + filtro de rol + contador */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.search}
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {search && (
            <button style={styles.clearBtn} onClick={() => handleSearchChange('')}>✕</button>
          )}
        </div>

        <div style={styles.roleFilters}>
          {ROLE_FILTERS.map(f => (
            <button
              key={f.value}
              style={{
                ...styles.filterBtn,
                ...(roleFilter === f.value ? styles.filterBtnActive : {}),
              }}
              onClick={() => handleRoleChange(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span style={styles.count}>
          {loading ? '…' : `${total} usuario${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Tabla */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.center}>Cargando usuarios…</div>
        ) : users.length === 0 ? (
          <div style={styles.center}>
            {debouncedSearch || roleFilter
              ? 'Sin resultados para los filtros aplicados.'
              : 'No hay usuarios registrados.'}
          </div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Usuario', 'Email', 'Rol', 'Estado', 'Registrado', 'Acciones'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.avatar}>
                            {(user.fullName ?? user.email ?? '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.userName}>{user.fullName ?? '—'}</div>
                            <div style={styles.userId}>ID #{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <RoleBadge isAdmin={user.isAdmin} />
                      </td>
                      <td style={styles.td}>
                        <StatusBadge blocked={user.isBlocked} />
                      </td>
                      <td style={styles.td}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('es-AR')
                          : '—'}
                      </td>
                      <td style={styles.td}>
                        {user.id === currentAdminId ? (
                          <span style={styles.selfBadge}>Tu cuenta</span>
                        ) : user.isAdmin ? (
                          <AdminBlockedButton />
                        ) : (
                          <button
                            style={{
                              ...styles.actionBtn,
                              ...(user.isBlocked ? styles.unblockBtn : styles.blockBtn),
                              opacity: actionLoading === user.id ? 0.5 : 1,
                            }}
                            onClick={() => toggleBlock(user)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id
                              ? '…'
                              : user.isBlocked ? '✅ Desbloquear' : '🚫 Bloquear'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

/**
 * Botón deshabilitado para filas de administrador, con tooltip informativo
 * que aparece al hacer hover explicando por qué no se puede bloquear.
 *
 * @returns {JSX.Element}
 */
function AdminBlockedButton() {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <button
        style={{ ...styles.actionBtn, ...styles.disabledBtn, cursor: 'not-allowed', opacity: 0.6 }}
        disabled
      >
        🚫 Bloquear
      </button>

      {tooltipVisible && (
        <div style={styles.adminTooltip}>
          <span style={styles.adminTooltipIcon}>ℹ️</span>
          No se pueden bloquear cuentas de administrador
          {/* Flecha apuntando hacia abajo */}
          <div style={styles.adminTooltipArrow} />
        </div>
      )}
    </div>
  )
}

/**
 * Modal de confirmación de bloqueo centrado en la pantalla con overlay oscuro.
 *
 * @param {{ user: object, onConfirm: () => void, onCancel: () => void }} props
 * @param {object}   props.user      - Usuario que se va a bloquear.
 * @param {Function} props.onConfirm - Callback al confirmar el bloqueo.
 * @param {Function} props.onCancel  - Callback al cancelar.
 * @returns {JSX.Element}
 */
function ConfirmBlockModal({ user, onConfirm, onCancel }) {
  const displayName = user.fullName ?? user.email ?? `Usuario #${user.id}`

  return (
    <div style={styles.overlay} onClick={onCancel}>
      {/* stopPropagation para que click dentro del modal no cierre el overlay */}
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalWarningIcon}>⚠️</div>

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
          <button style={styles.confirmBtn} onClick={onConfirm}>
            🚫 Bloquear
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Muestra un badge indicando si un usuario es administrador o usuario regular.
 *
 * @param {{ isAdmin: boolean }} props
 * @param {boolean} props.isAdmin - `true` si el usuario tiene rol de administrador.
 * @returns {JSX.Element} Badge de color morado para admins o gris para usuarios regulares.
 */
function RoleBadge({ isAdmin }) {
  return isAdmin
    ? <span style={{ ...styles.badge, backgroundColor: COLORS.primaryLight, color: COLORS.primary }}>Admin</span>
    : <span style={{ ...styles.badge, backgroundColor: '#f1f5f9', color: COLORS.textSecondary }}>Usuario</span>
}

/**
 * Muestra un badge indicando si un usuario está bloqueado o activo.
 *
 * @param {{ blocked: boolean }} props
 * @param {boolean} props.blocked - `true` si el usuario está bloqueado.
 * @returns {JSX.Element} Badge rojo para "Bloqueado" o verde para "Activo".
 */
function StatusBadge({ blocked }) {
  return blocked
    ? <span style={{ ...styles.badge, backgroundColor: COLORS.errorLight, color: COLORS.error }}>Bloqueado</span>
    : <span style={{ ...styles.badge, backgroundColor: COLORS.successLight, color: COLORS.success }}>Activo</span>
}

/**
 * Componente de paginación con navegación anterior/siguiente y botones de página numerados.
 *
 * Usa `buildPageList` para generar la secuencia de páginas con ellipsis (`…`) cuando
 * hay muchas páginas. El botón "Anterior" se deshabilita en la primera página y
 * "Siguiente" en la última.
 *
 * @param {{ page: number, totalPages: number, onChange: (page: number) => void }} props
 * @param {number} props.page - Página actualmente seleccionada.
 * @param {number} props.totalPages - Cantidad total de páginas disponibles.
 * @param {(page: number) => void} props.onChange - Callback invocado al cambiar de página.
 * @returns {JSX.Element} Barra de paginación con botones de navegación.
 */
function Pagination({ page, totalPages, onChange }) {
  const pages = buildPageList(page, totalPages)
  return (
    <div style={styles.pagination}>
      <button
        style={{ ...styles.pageBtn, ...(page === 1 ? styles.pageBtnDisabled : {}) }}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        ← Anterior
      </button>
      <div style={styles.pageNumbers}>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} style={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              style={{ ...styles.pageNum, ...(p === page ? styles.pageNumActive : {}) }}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
      </div>
      <button
        style={{ ...styles.pageBtn, ...(page === totalPages ? styles.pageBtnDisabled : {}) }}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Siguiente →
      </button>
    </div>
  )
}

/**
 * Construye la lista de páginas a mostrar en el paginador, insertando `'…'` como ellipsis
 * cuando hay saltos entre páginas no contiguas.
 *
 * Para totales de 7 páginas o menos devuelve todas las páginas sin ellipsis.
 * Para totales mayores, incluye siempre la primera y la última página, la página actual
 * y sus vecinas inmediatas (current-1, current+1), filtrando fuera de rango.
 *
 * @param {number} current - Página actualmente activa.
 * @param {number} total - Cantidad total de páginas.
 * @returns {Array<number | '…'>} Arreglo con los números de página y marcadores de ellipsis.
 *
 * @example
 * buildPageList(5, 20) // → [1, '…', 4, 5, 6, '…', 20]
 * buildPageList(1, 4)  // → [1, 2, 3, 4]
 */
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1].filter(p => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

const styles = { ...common, ...usersStyles }
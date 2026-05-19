import { useState, useEffect, useCallback, useRef } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'

/** Cantidad de usuarios por página en el listado. */
const PAGE_SIZE = 20

/**
 * Decodifica el payload de un JWT del localStorage para obtener el ID del admin autenticado.
 * Se usa para deshabilitar el botón de bloqueo en la propia fila del admin (CA4).
 *
 * @returns {number | null} ID numérico del admin autenticado, o null si no hay token válido.
 */
function getAuthenticatedAdminId() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return payload?.sub ? parseInt(payload.sub, 10) : null
  } catch {
    return null
  }
}

/**
 * Opciones disponibles para el filtro de rol.
 * El valor vacío `''` representa "sin filtro" (muestra todos los usuarios).
 *
 * @type {Array<{ value: string, label: string }>}
 */
const ROLE_FILTERS = [
  { value: '',      label: 'Todos'    },
  { value: 'user',  label: 'Usuarios' },
  { value: 'admin', label: 'Admins'   },
]

/**
 * Página de gestión de usuarios del panel de administración.
 *
 * Presenta una tabla paginada de todos los usuarios registrados en el sistema,
 * con las siguientes capacidades:
 * - Búsqueda por nombre o email con debounce de 400 ms para evitar llamadas excesivas a la API.
 * - Filtro de rol (Todos / Usuarios / Admins) mediante pills de selección.
 * - Acciones de bloqueo y desbloqueo por usuario (con protección para no bloquear admins).
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
   * Alterna el estado de bloqueo de un usuario (bloquear ↔ desbloquear).
   *
   * Si el usuario es administrador, muestra un toast de advertencia y retorna sin hacer nada.
   * De lo contrario, llama a PATCH /users/:id/block o PATCH /users/:id/unblock según corresponda,
   * y actualiza el estado local del usuario sin recargar toda la lista.
   * Durante la operación, marca al usuario como "en carga" para deshabilitar su botón.
   *
   * @async
   * @param {{ id: number, isAdmin: boolean, isBlocked: boolean }} user - Objeto del usuario a modificar.
   * @returns {Promise<void>}
   */
  async function toggleBlock(user) {
    if (user.isAdmin) {
      showWarning('No podés bloquear a otro administrador del sistema.')
      return
    }
    if (user.id === currentAdminId) {
      showWarning('No podés bloquear tu propia cuenta.')
      return
    }
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

  return (
    <div style={styles.page}>
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
                        ) : (
                          <button
                            style={{
                              ...styles.actionBtn,
                              ...(user.isAdmin ? styles.disabledBtn : user.isBlocked ? styles.unblockBtn : styles.blockBtn),
                              opacity: (actionLoading === user.id || user.isAdmin) ? 0.5 : 1,
                              cursor: user.isAdmin ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => toggleBlock(user)}
                            disabled={actionLoading === user.id || user.isAdmin}
                            title={user.isAdmin ? 'No podés bloquear a otro administrador' : undefined}
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

const styles = {
  page: { padding: '32px 36px', maxWidth: 1100 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, margin: 0 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, margin: '4px 0 0' },
  refreshBtn: {
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },

  warningToast: {
    position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
    backgroundColor: COLORS.warningLight, color: '#92400e',
    border: `1px solid ${COLORS.warning}`, borderRadius: 10,
    padding: '12px 20px', fontSize: 13, fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1000,
    whiteSpace: 'nowrap',
  },

  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchWrapper: { flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none' },
  search: {
    width: '100%', height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 36px 0 36px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  clearBtn: {
    position: 'absolute', right: 10, background: 'none', border: 'none',
    cursor: 'pointer', color: COLORS.textMuted, fontSize: 14, padding: '0 2px',
  },
  roleFilters: { display: 'flex', gap: 6 },
  filterBtn: {
    padding: '6px 14px', borderRadius: 20, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary, color: COLORS.white, border: `1px solid ${COLORS.primary}`,
  },
  count: { fontSize: 13, color: COLORS.textSecondary, whiteSpace: 'nowrap' },

  errorBox: {
    backgroundColor: COLORS.errorLight, color: COLORS.error, borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  center: { textAlign: 'center', color: COLORS.textSecondary, padding: '48px 0', fontSize: 14 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '12px 16px', fontWeight: 600,
    color: COLORS.textSecondary, backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap',
  },
  tr: { borderBottom: `1px solid ${COLORS.border}` },
  td: { padding: '12px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', backgroundColor: COLORS.primaryLight,
    color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontWeight: 600, color: COLORS.textPrimary, fontSize: 13 },
  userId: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actionBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  blockBtn:    { backgroundColor: COLORS.errorLight,   color: COLORS.error   },
  unblockBtn:  { backgroundColor: COLORS.successLight, color: COLORS.success },
  disabledBtn: { backgroundColor: '#f1f5f9', color: COLORS.textMuted },
  selfBadge:   { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderTop: `1px solid ${COLORS.border}`,
  },
  pageBtn: {
    padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  pageBtnDisabled: { opacity: 0.4, cursor: 'default' },
  pageNumbers: { display: 'flex', gap: 4, alignItems: 'center' },
  pageNum: {
    width: 34, height: 34, borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  pageNumActive: {
    backgroundColor: COLORS.primary, color: COLORS.white, border: `1px solid ${COLORS.primary}`,
  },
  ellipsis: { fontSize: 13, color: COLORS.textMuted, padding: '0 4px' },
}

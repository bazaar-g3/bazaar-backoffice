import { useState, useEffect, useCallback } from 'react'
import { COLORS } from '../constants/colors'
import api from '../api/api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState(null) // user id being toggled

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/users/')
      setUsers(Array.isArray(res.data) ? res.data : res.data.users ?? [])
    } catch {
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function toggleBlock(user) {
    const endpoint = user.is_blocked ? `/users/${user.id}/unblock` : `/users/${user.id}/block`
    setActionLoading(user.id)
    try {
      await api.patch(endpoint)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u))
    } catch {
      alert('No se pudo realizar la acción. Intentá de nuevo.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.name ?? u.full_name ?? '').toLowerCase().includes(q) ||
      String(u.id ?? '').includes(q)
    )
  })

  return (
    <div style={styles.page}>
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

      {/* Search */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          type="text"
          placeholder="Buscar por nombre, email o ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={styles.count}>
          {loading ? '…' : `${filtered.length} usuario${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Table */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.center}>Cargando usuarios…</div>
        ) : filtered.length === 0 ? (
          <div style={styles.center}>No se encontraron usuarios.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['ID', 'Nombre', 'Email', 'Rol', 'Estado', 'Registrado', 'Acciones'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.mono}>#{String(user.id ?? '').slice(0, 8)}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.nameCell}>
                        <div style={styles.avatar}>
                          {(user.name ?? user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                        </div>
                        <span>{user.name ?? user.full_name ?? '—'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{user.email ?? '—'}</td>
                    <td style={styles.td}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td style={styles.td}>
                      <StatusBadge blocked={user.is_blocked} />
                    </td>
                    <td style={styles.td}>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('es-AR')
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...(user.is_blocked ? styles.unblockBtn : styles.blockBtn),
                          opacity: actionLoading === user.id ? 0.6 : 1,
                        }}
                        onClick={() => toggleBlock(user)}
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id
                          ? '…'
                          : user.is_blocked ? '✅ Desbloquear' : '🚫 Bloquear'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleBadge({ role }) {
  const map = {
    admin:  { label: 'Admin',   bg: COLORS.primaryLight, color: COLORS.primary },
    seller: { label: 'Vendedor', bg: COLORS.infoLight,    color: COLORS.info    },
    buyer:  { label: 'Comprador', bg: '#f1f5f9',          color: COLORS.textSecondary },
  }
  const s = map[role] ?? { label: role ?? 'Usuario', bg: '#f1f5f9', color: COLORS.textSecondary }
  return <span style={{ ...styles.badge, backgroundColor: s.bg, color: s.color }}>{s.label}</span>
}

function StatusBadge({ blocked }) {
  return blocked
    ? <span style={{ ...styles.badge, backgroundColor: COLORS.errorLight, color: COLORS.error }}>Bloqueado</span>
    : <span style={{ ...styles.badge, backgroundColor: COLORS.successLight, color: COLORS.success }}>Activo</span>
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
  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  search: {
    flex: 1, height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 14px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
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
  tr: { borderBottom: `1px solid ${COLORS.border}`, transition: 'background 0.1s' },
  td: { padding: '12px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', backgroundColor: COLORS.primaryLight,
    color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  actionBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  blockBtn: { backgroundColor: COLORS.errorLight, color: COLORS.error },
  unblockBtn: { backgroundColor: COLORS.successLight, color: COLORS.success },
}

import { COLORS } from '../constants/colors'

export const common = {
  // Layout
  page:    { padding: '32px 36px', maxWidth: 1100 },
  header:  { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  title:   { fontSize: 24, fontWeight: 800, color: COLORS.textPrimary, margin: 0 },
  subtitle:{ fontSize: 13, color: COLORS.textSecondary, margin: '4px 0 0' },

  // Controles comunes
  refreshBtn: {
    padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  count: { fontSize: 13, color: COLORS.textSecondary, whiteSpace: 'nowrap' },
  search: {
    flex: 1, height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 14px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary, color: COLORS.white, border: `1px solid ${COLORS.primary}`,
  },

  // Feedback
  errorBox: {
    backgroundColor: COLORS.errorLight, color: COLORS.error, borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  center: { textAlign: 'center', color: COLORS.textSecondary, padding: '48px 0', fontSize: 14 },

  // Card contenedor
  card: {
    backgroundColor: COLORS.white, borderRadius: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
  },

  // Tabla
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left', padding: '12px 16px', fontWeight: 600,
    color: COLORS.textSecondary, backgroundColor: '#f8fafc',
    borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap',
  },
  tr:    { borderBottom: `1px solid ${COLORS.border}` },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },

  // Modal compartido
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
}

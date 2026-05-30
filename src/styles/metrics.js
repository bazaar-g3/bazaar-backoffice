import { COLORS } from '../constants/colors'

export const metricsStyles = {
  // Override de common
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  th: {
    textAlign: 'left', padding: '8px 12px', fontWeight: 600,
    color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', color: COLORS.textPrimary, verticalAlign: 'middle' },

  headerActions:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  headerControls: { display: 'flex', gap: 12, alignItems: 'center' },
  exportError:    { fontSize: 12, color: COLORS.error, margin: 0, textAlign: 'right' },
  periodSelector: { display: 'flex', gap: 6, alignItems: 'center' },
  exportBtn: {
    padding: '7px 16px', borderRadius: 8, border: 'none',
    backgroundColor: COLORS.secondary, color: COLORS.white,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  periodBtn: {
    padding: '7px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary, color: COLORS.white,
    border: `1px solid ${COLORS.primary}`,
  },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16, marginBottom: 32,
  },
  statCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: '20px 22px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  },
  statValue: { fontSize: 26, fontWeight: 800, color: COLORS.textPrimary, lineHeight: 1 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  skeleton: {
    display: 'inline-block', width: 60, height: 26,
    backgroundColor: '#e2e8f0', borderRadius: 6, verticalAlign: 'middle',
  },

  section: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: '20px 22px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 16px' },
  loadingBox: { textAlign: 'center', color: COLORS.textSecondary, padding: '32px 0', fontSize: 14 },
  emptyBox:   { textAlign: 'center', color: COLORS.textSecondary, padding: '32px 0', fontSize: 14 },

  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: '20px 22px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  },
  chartTitle: { fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 12px' },

  tablesRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
}

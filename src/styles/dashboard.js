import { COLORS } from '../constants/colors'

export const dashboardStyles = {
  // Overrides de common
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  th: {
    textAlign: 'left', padding: '8px 12px', fontWeight: 600,
    color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', color: COLORS.textPrimary, verticalAlign: 'middle' },

  // Stat cards
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
  skeleton:  { display: 'inline-block', width: 60, height: 26, backgroundColor: '#e2e8f0', borderRadius: 6, verticalAlign: 'middle' },

  // Secciones
  section: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: '20px 22px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 24,
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 16px' },
  loadingBox:   { textAlign: 'center', color: COLORS.textSecondary, padding: '32px 0', fontSize: 14 },
  emptyBox:     { textAlign: 'center', color: COLORS.textSecondary, padding: '32px 0', fontSize: 14 },
  orderId:      { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },

  // Gráficos
  chartsRow:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  chartCard:        { backgroundColor: COLORS.white, borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  chartTitle:       { fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 12px' },
  chartPlaceholder: { height: 180, border: `2px dashed ${COLORS.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chartHint:        { fontSize: 13, color: COLORS.textMuted },
}

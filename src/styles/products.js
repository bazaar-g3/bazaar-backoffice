import { COLORS } from '../constants/colors'

export const productsStyles = {
  // Override de common
  td: { padding: '10px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },

  // Toolbar
  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },

  // Filtros de estado
  filterRow:       { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterPill: {
    padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  filterPillActive: {
    backgroundColor: COLORS.primary, color: COLORS.white,
    border: `1.5px solid ${COLORS.primary}`,
  },

  // Celdas específicas
  mono:            { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  productName:     { fontWeight: 600, color: COLORS.textPrimary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productCategory: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Botones de acción de moderación
  disableBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    backgroundColor: COLORS.errorLight, color: COLORS.error,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  enableBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    backgroundColor: COLORS.successLight, color: COLORS.success,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },

  // Paginación
  pagination:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 0 4px' },
  pageBtn: {
    minWidth: 32, height: 32, borderRadius: 6, border: `1.5px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  pageBtnActive: {
    backgroundColor: COLORS.primary, color: COLORS.white,
    border: `1.5px solid ${COLORS.primary}`,
  },
  pageBtnDisabled: { opacity: 0.4, cursor: 'default' },

  // Modal de confirmación de moderación
  modal: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: '32px 36px',
    maxWidth: 420, width: '90%', textAlign: 'center',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  modalIcon:    { fontSize: 40, marginBottom: 12 },
  modalTitle:   { fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, margin: '0 0 10px' },
  modalText:    { fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.5, margin: '0 0 24px' },
  modalActions: { display: 'flex', gap: 12, justifyContent: 'center' },
  cancelBtn: {
    padding: '10px 22px', borderRadius: 8, border: `1.5px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    backgroundColor: COLORS.error, color: COLORS.white, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },
  confirmEnableBtn: {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    backgroundColor: COLORS.success, color: COLORS.white, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },

  // Modal de detalle de producto
  detailOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    zIndex: 999, overflowY: 'auto', padding: '40px 16px',
  },
  detailModal: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: '32px 36px',
    maxWidth: 640, width: '100%', textAlign: 'left',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  detailHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  detailTitle:  { fontSize: 18, fontWeight: 800, color: COLORS.textPrimary, margin: 0 },
  detailClose: {
    background: 'none', border: 'none', fontSize: 22, color: COLORS.textMuted,
    cursor: 'pointer', lineHeight: 1, padding: 0,
  },
  detailImg: {
    width: '100%', maxHeight: 200, objectFit: 'cover',
    borderRadius: 10, marginBottom: 20,
  },
  detailGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20,
  },
  detailCell:  {},
  detailLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 },
  detailValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: 500 },
  detailSection:{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, margin: '20px 0 10px', borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 },
  historyTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  historyTh:    { textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, backgroundColor: '#f8fafc' },
  historyTd:    { padding: '6px 10px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textPrimary },
  historyEmpty: { textAlign: 'center', color: COLORS.textMuted, padding: '12px 0', fontSize: 13 },
}

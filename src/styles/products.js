import { COLORS } from '../constants/colors'

export const productsStyles = {
  // Override de common
  td: { padding: '10px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },

  // Toolbar
  toolbar: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },

  // Celdas específicas
  mono:            { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  productName:     { fontWeight: 600, color: COLORS.textPrimary, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productCategory: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  deleteBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    backgroundColor: COLORS.errorLight, color: COLORS.error,
    fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
  },

  // Modal de confirmación de borrado
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
}

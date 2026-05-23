import { COLORS } from '../constants/colors'

export const usersStyles = {
  // Override de common
  td:     { padding: '12px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, backdropFilter: 'blur(2px)',
  },

  // Toolbar y búsqueda
  warningToast: {
    position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
    backgroundColor: COLORS.warningLight, color: '#92400e',
    border: `1px solid ${COLORS.warning}`, borderRadius: 10,
    padding: '12px 20px', fontSize: 13, fontWeight: 600,
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1000, whiteSpace: 'nowrap',
  },
  toolbar:       { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  searchWrapper: { flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon:    { position: 'absolute', left: 12, fontSize: 14, pointerEvents: 'none' },
  search: {
    width: '100%', height: 40, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 36px 0 36px', fontSize: 13, outline: 'none', color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  clearBtn:   { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, fontSize: 14, padding: '0 2px' },
  roleFilters:{ display: 'flex', gap: 6 },
  filterBtn:  {
    padding: '6px 14px', borderRadius: 20, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },

  // Celdas de usuario
  nameCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: '50%', backgroundColor: COLORS.primaryLight,
    color: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userName: { fontWeight: 600, color: COLORS.textPrimary, fontSize: 13 },
  userId:   { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },

  // Botones de acción
  actionBtn:   { padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  blockBtn:    { backgroundColor: COLORS.errorLight,   color: COLORS.error   },
  unblockBtn:  { backgroundColor: COLORS.successLight, color: COLORS.success },
  disabledBtn: { backgroundColor: '#f1f5f9', color: COLORS.textMuted },
  selfBadge:   { fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' },

  // Tooltip del botón admin
  adminTooltip: {
    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
    backgroundColor: COLORS.textPrimary, color: COLORS.white,
    fontSize: 11, fontWeight: 500, padding: '7px 11px', borderRadius: 7,
    whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    zIndex: 100, display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none',
  },
  adminTooltipIcon:  { fontSize: 12 },
  adminTooltipArrow: {
    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
    width: 0, height: 0,
    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
    borderTop: `6px solid ${COLORS.textPrimary}`,
  },

  // Modal de bloqueo
  modal: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: '36px 40px',
    maxWidth: 440, width: '90%', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
  },
  modalWarningIcon: { fontSize: 44, marginBottom: 12 },
  modalTitle:       { fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, margin: '0 0 14px' },
  modalBody:        { fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6, margin: '0 0 6px' },
  modalSubtext:     { fontSize: 13, color: COLORS.textMuted, margin: '0 0 6px', lineHeight: 1.5 },
  modalQuestion:    { fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, margin: '10px 0 24px' },
  modalActions:     { display: 'flex', gap: 12, justifyContent: 'center', width: '100%' },
  cancelBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8, border: `1.5px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 14,
    fontWeight: 600, cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
    backgroundColor: COLORS.error, color: COLORS.white, fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
  },

  // Paginación
  pagination:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderTop: `1px solid ${COLORS.border}` },
  pageBtn:        { padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  pageBtnDisabled:{ opacity: 0.4, cursor: 'default' },
  pageNumbers:    { display: 'flex', gap: 4, alignItems: 'center' },
  pageNum:        { width: 34, height: 34, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  pageNumActive:  { backgroundColor: COLORS.primary, color: COLORS.white, border: `1px solid ${COLORS.primary}` },
  ellipsis:       { fontSize: 13, color: COLORS.textMuted, padding: '0 4px' },
}

import { COLORS } from '../constants/colors'

export const ordersStyles = {
  // Override de common
  td: { padding: '11px 16px', color: COLORS.textPrimary, verticalAlign: 'middle' },

  // Toolbar de dos filas
  toolbar:    { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
  toolbarRow: { display: 'flex', alignItems: 'center', gap: 12 },
  filterGroup:{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 },
  filterBtn:  {
    padding: '6px 12px', borderRadius: 20, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.white, color: COLORS.textSecondary,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },

  // Tabla
  mono:       { fontFamily: 'monospace', fontSize: 12, color: COLORS.textSecondary },
  expandIcon: { fontSize: 10, color: COLORS.textMuted, cursor: 'pointer' },

  // Fila expandida
  expandedCell: { padding: 0, backgroundColor: '#f8fafc', borderBottom: `1px solid ${COLORS.border}` },
  detailBox:    { padding: '16px 20px' },
  detailGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px 20px', marginBottom: 16 },
  detailField:  {},
  detailLabel:  { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue:  { fontSize: 13, color: COLORS.textPrimary },

  // Ítems, vendedores e historial dentro del detalle
  itemsSection:   { marginTop: 12 },
  itemsTitle:     { fontSize: 11, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: 8 },
  itemRow:        { display: 'flex', gap: 16, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.textPrimary },
  itemQty:        { color: COLORS.textSecondary, minWidth: 30 },
  fulfillmentRow: { display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 },
  trackingCode:   { color: COLORS.textSecondary, fontSize: 12 },
  historyRow:     { display: 'flex', gap: 12, alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${COLORS.border}` },
  historyDate:    { fontSize: 12, color: COLORS.textSecondary },

  // Paginación
  pagination:     { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 },
  pageBtn:        { padding: '8px 16px', borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.white, color: COLORS.textPrimary, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  pageBtnDisabled:{ color: COLORS.textMuted, cursor: 'not-allowed', backgroundColor: '#f8fafc' },
  pageInfo:       { fontSize: 13, color: COLORS.textSecondary },
}

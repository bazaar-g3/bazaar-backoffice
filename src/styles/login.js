import { COLORS } from '../constants/colors'

export const loginStyles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logoArea:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon:  { fontSize: 32 },
  logoTitle: { fontSize: 20, fontWeight: 800, color: COLORS.primary, letterSpacing: 1 },
  logoSub:   { fontSize: 12, color: COLORS.textSecondary },
  heading:   { fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 },
  errorBox: {
    backgroundColor: COLORS.errorLight, color: COLORS.error, borderRadius: 8,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  errorIcon: { flexShrink: 0 },
  form:      { display: 'flex', flexDirection: 'column', gap: 16 },
  field:     { display: 'flex', flexDirection: 'column', gap: 6 },
  label:     { fontSize: 13, fontWeight: 600, color: COLORS.textSecondary },
  input: {
    height: 44, border: `1.5px solid ${COLORS.border}`, borderRadius: 8,
    padding: '0 12px', fontSize: 14, outline: 'none', color: COLORS.textPrimary,
  },
  btn: {
    height: 46, backgroundColor: COLORS.primary, color: COLORS.white,
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
    marginTop: 4, cursor: 'pointer',
  },
}

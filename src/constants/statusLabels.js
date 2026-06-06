import { COLORS } from './colors'

/**
 * Configuración visual y etiquetas para cada estado de orden.
 * Incluye etiqueta en español, color de fondo y color de texto para badges.
 *
 * @type {Record<string, { label: string, bg: string, color: string }>}
 */
export const ORDER_STATUS_CONFIG = {
  pending_payment:    { label: 'Pago pendiente',       bg: COLORS.warningLight, color: COLORS.warning },
  confirmed:          { label: 'Confirmada',            bg: COLORS.infoLight,    color: COLORS.info    },
  in_preparation:     { label: 'En preparación',        bg: COLORS.infoLight,    color: COLORS.info    },
  shipped:            { label: 'Enviada',               bg: COLORS.primaryLight, color: COLORS.primary },
  delivered:          { label: 'Entregada',             bg: COLORS.successLight, color: COLORS.success },
  payment_rejected:   { label: 'Pago rechazado',        bg: COLORS.errorLight,   color: COLORS.error   },
  cancelled:          { label: 'Cancelada',             bg: COLORS.errorLight,   color: COLORS.error   },
  refund_in_progress: { label: 'Reembolso en proceso',  bg: COLORS.warningLight, color: COLORS.warning },
  refund_processed:   { label: 'Reembolsada',           bg: COLORS.successLight, color: COLORS.success },
  // Valores legacy de la API anterior
  pending:            { label: 'Pendiente',             bg: COLORS.warningLight, color: COLORS.warning },
  paid:               { label: 'Pagada',                bg: COLORS.successLight, color: COLORS.success },
}

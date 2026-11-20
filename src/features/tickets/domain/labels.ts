import type { TicketStatus } from './types.ts'

/**
 * Status em linguagem simples, para quem não conhece o fluxo interno.
 */
export function statusLabel(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'Aguardando alguém assumir'
    case 'in_progress':
      return 'Alguém está cuidando'
    case 'waiting_on_customer':
      return 'Precisamos de você'
    case 'resolved':
      return 'Resolvido'
    case 'closed':
      return 'Fechado'
    default: {
      /** Valor neverStatus. */
      const neverStatus: never = status
      return neverStatus
    }
  }
}

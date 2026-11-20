import { z } from 'zod'
import { MESSAGE_VISIBILITIES, TICKET_STATUSES } from '../domain/types.ts'

/** Corpo do pedido que abre um chamado. */
export const openTicketSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(8000),
})

/** Corpo do pedido que adiciona uma mensagem. */
export const messageSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  visibility: z.enum(MESSAGE_VISIBILITIES),
})

/** Corpo do pedido que muda o status. */
export const statusSchema = z.object({
  to: z.enum(TICKET_STATUSES),
  reason: z.string().trim().min(3).max(2000),
})

/** Corpo do pedido que redistribui um chamado. */
export const assignSchema = z.object({
  consultantId: z.string().min(1),
})

/** Corpo da escolha de persona. */
export const personaSchema = z.object({
  personaId: z.string().min(1),
})

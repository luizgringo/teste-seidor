import { z } from 'zod'
import { MESSAGE_VISIBILITIES, TICKET_STATUSES } from '../domain/types.ts'

/** Body of a request that opens a ticket. */
export const openTicketSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(8000),
})

/** Body of a request that adds a message. */
export const messageSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  visibility: z.enum(MESSAGE_VISIBILITIES),
})

/** Body of a request that changes status. */
export const statusSchema = z.object({
  to: z.enum(TICKET_STATUSES),
  reason: z.string().trim().min(3).max(2000),
})

/** Body of a request that reassigns a ticket. */
export const assignSchema = z.object({
  consultantId: z.string().min(1),
})

/** Body of the persona selection. */
export const personaSchema = z.object({
  personaId: z.string().min(1),
})

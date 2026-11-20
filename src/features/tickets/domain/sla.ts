import type { Priority } from './types.ts'

/** Metas em hora corrida. Calendário de expediente fica de fora desta fatia. */
export const SLA_MINUTES: Record<Priority, number> = {
  critical: 4 * 60,
  high: 8 * 60,
  medium: 24 * 60,
  low: 72 * 60,
}

/** Vencimento dentro deste número de minutos conta como perto de estourar. */
export const AT_RISK_MINUTES = 120

/** Tipo DueTone. */
export type DueTone = 'breached' | 'soon' | 'ok'

/**
 * Distância de agora até o vencimento, em minutos corridos.
 * Calendário de expediente não entra. O passo seguinte é descontar as horas fechadas do grupo antes de comparar.
 */
export function dueState(dueAt: string, nowMs: number): { minutes: number; tone: DueTone } {
  /** Valor minutes. */
  const minutes = Math.round((Date.parse(dueAt) - nowMs) / 60_000)
  if (minutes < 0) return { minutes, tone: 'breached' }
  if (minutes <= AT_RISK_MINUTES) return { minutes, tone: 'soon' }
  return { minutes, tone: 'ok' }
}

/** Rótulo curto do prazo numa linha da fila. */
export function dueLabel(dueAt: string, nowMs: number): string {
  /** Valor valor. */
  const { minutes, tone } = dueState(dueAt, nowMs)
  /** Valor absolute. */
  const absolute = Math.abs(minutes)
  /** Valor hours. */
  const hours = Math.floor(absolute / 60)
  /** Valor rest. */
  const rest = absolute % 60
  /** Valor text. */
  const text = hours === 0 ? `${rest}min` : `${hours}h ${rest}min`
  if (tone === 'breached') return `Estourou há ${text}`
  return `Vence em ${text}`
}

/** O prazo mais próximo vem primeiro, e o estourado fica no topo. */
export function compareByDue(left: { dueAt: string }, right: { dueAt: string }): number {
  return Date.parse(left.dueAt) - Date.parse(right.dueAt)
}

import type { Priority } from './types.ts'

/** Clock-hour targets. Business calendars are intentionally out of this slice. */
export const SLA_MINUTES: Record<Priority, number> = {
  critical: 4 * 60,
  high: 8 * 60,
  medium: 24 * 60,
  low: 72 * 60,
}

/** Due within this many minutes is "about to breach". */
export const AT_RISK_MINUTES = 120

/** Tipo DueTone. */
export type DueTone = 'breached' | 'soon' | 'ok'

/**
 * Distance from now to the due instant, in clock minutes.
 * Business-hour calendars are not applied. Upgrade path: subtract the group's closed hours before comparing.
 */
export function dueState(dueAt: string, nowMs: number): { minutes: number; tone: DueTone } {
  /** Valor minutes. */
  const minutes = Math.round((Date.parse(dueAt) - nowMs) / 60_000)
  if (minutes < 0) return { minutes, tone: 'breached' }
  if (minutes <= AT_RISK_MINUTES) return { minutes, tone: 'soon' }
  return { minutes, tone: 'ok' }
}

/** Short clock label for a queue row. */
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

/** Soonest due first, which also puts breached tickets at the top. */
export function compareByDue(left: { dueAt: string }, right: { dueAt: string }): number {
  return Date.parse(left.dueAt) - Date.parse(right.dueAt)
}

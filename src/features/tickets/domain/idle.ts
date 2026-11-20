import type { Assignment } from './types.ts'

/**
 * Minutes in the window during which the consultant had no open assignment.
 * Overlapping assignments count once.
 */
export function idleMinutes(
  consultantId: string,
  assignments: Assignment[],
  windowStartMs: number,
  windowEndMs: number,
): number {
  if (windowEndMs <= windowStartMs) return 0
  /** Valor clipped. */
  const clipped = assignments
    .filter((assignment) => assignment.consultantId === consultantId)
    .map((assignment) => ({
      start: Math.max(Date.parse(assignment.startedAt), windowStartMs),
      end: Math.min(assignment.endedAt ? Date.parse(assignment.endedAt) : windowEndMs, windowEndMs),
    }))
    .filter((interval) => interval.end > interval.start)
  /** Valor busy. */
  const busy = mergedDuration(clipped)
  /** Valor windowMinutes. */
  const windowMinutes = Math.round((windowEndMs - windowStartMs) / 60_000)
  return Math.max(0, windowMinutes - busy)
}

/** Executa mergedDuration. */
function mergedDuration(intervals: { start: number; end: number }[]): number {
  /** Valor sorted. */
  const sorted = [...intervals].sort((left, right) => left.start - right.start)
  /** Valor busyMs. */
  let busyMs = 0
  /** Valor current. */
  let current: { start: number; end: number } | null = null
  for (const interval of sorted) {
    if (!current || interval.start > current.end) {
      if (current) busyMs += current.end - current.start
      current = { ...interval }
    } else {
      current.end = Math.max(current.end, interval.end)
    }
  }
  if (current) busyMs += current.end - current.start
  return Math.round(busyMs / 60_000)
}

import { readFileSync } from 'node:fs'

/** Reads local env files without overriding variables already set by the process. */
export function loadLocalEnv(): void {
  if (process.env.VERCEL) return
  for (const file of ['.env', '.env.development']) {
    try {
      applyEnv(readFileSync(file, 'utf8'))
    } catch {
      // A missing local file is expected when the process already received its environment.
    }
  }
}

/** Session secret. Production refuses to boot without one. */
export function sessionSecret(): string {
  /** Valor secret. */
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 16) return secret
  if (process.env.VERCEL) throw new Error('SESSION_SECRET is required')
  return 'dev-only-secret-change-me'
}

/** Executa applyEnv. */
function applyEnv(text: string): void {
  for (const line of text.split('\n')) {
    /** Valor trimmed. */
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    /** Valor index. */
    const index = trimmed.indexOf('=')
    if (index <= 0) continue
    /** Valor key. */
    const key = trimmed.slice(0, index)
    if (process.env[key] !== undefined) continue
    process.env[key] = trimmed.slice(index + 1)
  }
}

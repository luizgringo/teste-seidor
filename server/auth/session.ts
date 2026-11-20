import { createHmac, timingSafeEqual } from 'node:crypto'

/** Valor COOKIE. */
const COOKIE = 'itsm_session'

/** Quem autenticou e qual persona está vendo. */
export type Session = {
  githubLogin: string
  githubName: string
  personaId: string | null
}

/** Serializa a sessão num valor de cookie assinado. */
export function encodeSession(session: Session, secret: string): string {
  /** Valor payload. */
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  /** Valor mac. */
  const mac = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

/** Lê o cookie da sessão. Devolve nulo quando a assinatura não confere. */
export function readSession(cookieHeader: string | undefined, secret: string): Session | null {
  /** Valor raw. */
  const raw = cookieValue(cookieHeader, COOKIE)
  if (!raw) return null
  /** Valor dot. */
  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  /** Valor payload. */
  const payload = raw.slice(0, dot)
  /** Valor mac. */
  const mac = raw.slice(dot + 1)
  /** Valor expected. */
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  /** Valor left. */
  const left = Buffer.from(mac)
  /** Valor right. */
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    /** Valor parsed. */
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session
    if (!parsed.githubLogin || !parsed.githubName) return null
    return parsed
  } catch {
    return null
  }
}

/** Cabeçalho Set-Cookie da sessão. */
export function sessionCookie(session: Session, secret: string): string {
  /** Valor secure. */
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${COOKIE}=${encodeSession(session, secret)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${secure}`
}

/** Apaga o cookie da sessão. */
export function clearSessionCookie(): string {
  /** Valor secure. */
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
}

/** Executa cookieValue. */
function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    /** Valor valor. */
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

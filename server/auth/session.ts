import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE = 'itsm_session'

/** Who authenticated, and which persona they are viewing as. */
export type Session = {
  githubLogin: string
  githubName: string
  personaId: string | null
}

/** Serializes a session into a signed cookie value. */
export function encodeSession(session: Session, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  const mac = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${mac}`
}

/** Reads the session cookie. Returns null when the signature does not match. */
export function readSession(cookieHeader: string | undefined, secret: string): Session | null {
  const raw = cookieValue(cookieHeader, COOKIE)
  if (!raw) return null
  const dot = raw.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = raw.slice(0, dot)
  const mac = raw.slice(dot + 1)
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  const left = Buffer.from(mac)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session
    if (!parsed.githubLogin || !parsed.githubName) return null
    return parsed
  } catch {
    return null
  }
}

/** Set-Cookie header for the session. */
export function sessionCookie(session: Session, secret: string): string {
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${COOKIE}=${encodeSession(session, secret)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200${secure}`
}

/** Clears the session cookie. */
export function clearSessionCookie(): string {
  const secure = process.env.VERCEL ? '; Secure' : ''
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
}

function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

// lib/session.ts
// Gestión de sesiones via cookie httpOnly

import { cookies } from 'next/headers'

export interface Session {
  isAdmin: boolean
  coupleId: string | null
  username: string
  coupleName: string
}

const COOKIE_NAME = 'complices_session'

// ─── Credenciales del super-administrador ─────────────────────────────────────
// Cambia estas antes de publicar en producción
export const ADMIN_USERNAME = 'superadmin'
export const ADMIN_PASSWORD = 'Complices2026'

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    if (!cookie?.value) return null
    const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8')
    return JSON.parse(decoded) as Session
  } catch {
    return null
  }
}

export async function createSession(session: Session): Promise<void> {
  const cookieStore = await cookies()
  const encoded = Buffer.from(JSON.stringify(session)).toString('base64')
  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    sameSite: 'lax',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

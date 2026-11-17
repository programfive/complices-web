import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionCookie = req.cookies.get('complices_session')

  // Permitir login y rutas api/auth
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Si no hay sesión, mandar a /login
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    const session = JSON.parse(decoded)

    // Si es un usuario normal (no admin), restringir rutas de admin como /couples
    if (!session.isAdmin && pathname === '/couples') {
      return NextResponse.redirect(new URL('/notifications', req.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

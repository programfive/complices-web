'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.session) setSession(data.session)
      })
      .catch(() => {})
  }, [path])

  // Ocultar sidebar en /login
  if (path === '/login') {
    return null
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '◈' },
    { href: '/notifications', label: 'Notificaciones', icon: '🔔' },
    { href: '/location', label: 'Ubicación GPS', icon: '📍' },
    { href: '/gallery', label: 'Galería Sync', icon: '🖼️' },
    // Solo mostrar "Parejas" si es administrador
    ...(session?.isAdmin ? [{ href: '/couples', label: 'Parejas', icon: '♡' }] : []),
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/memories', label: 'Recuerdos', icon: '✦' },
    { href: '/plans', label: 'Planes', icon: '✎' },
  ]

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      backgroundColor: '#2A080D',
      borderRight: '1px solid rgba(212,175,90,0.25)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 18px',
        borderBottom: '1px solid rgba(212,175,90,0.2)',
      }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
          {session?.isAdmin ? 'ADMIN PANEL' : 'ESPACIO PRIVADO'}
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#F7EFE4', letterSpacing: 0.5 }}>
          Cómplices
        </h1>
        <p style={{
          fontSize: 10,
          color: '#F3E5AB',
          marginTop: 3,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {session ? session.coupleName : 'Cargando...'}
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px' }}>
        {navItems.map(({ href, label, icon }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                marginBottom: 4,
                backgroundColor: active ? 'rgba(212,175,90,0.15)' : 'transparent',
                border: active ? '1px solid rgba(212,175,90,0.4)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#F3E5AB' : '#C7B7A3',
                }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer con usuario y Logout */}
      <div style={{
        padding: '16px 16px',
        borderTop: '1px solid rgba(212,175,90,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#4ade80',
          }} />
          <span style={{ fontSize: 11, color: '#A89186' }}>
            @{session?.username || 'sesión activa'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'rgba(224,108,117,0.15)',
            border: '1px solid rgba(224,108,117,0.35)',
            color: '#E06C75',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Cerrar Sesión ⎋
        </button>
      </div>
    </aside>
  )
}

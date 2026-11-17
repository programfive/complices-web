// app/page.tsx — Dashboard Overview
import { getDashboardStats, getTopApps, getRecentActivity } from '@/lib/supabase'

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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default async function DashboardPage() {
  const [stats, topApps, activity] = await Promise.all([
    getDashboardStats(),
    getTopApps(6),
    getRecentActivity(),
  ])

  const STAT_CARDS = [
    { label: 'Parejas',         value: stats.couples,       icon: '♡',  color: '#D4AF5A' },
    { label: 'Notificaciones',  value: stats.notifications, icon: '🔔', color: '#F3E5AB' },
    { label: 'Mensajes Chat',   value: stats.chats,         icon: '💬', color: '#D4AF5A' },
    { label: 'Recuerdos',       value: stats.memories,      icon: '✦',  color: '#C7B7A3' },
    { label: 'Planes',          value: stats.plans,         icon: '✎',  color: '#D4AF5A' },
  ]

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 6 }}>
          PANEL DE CONTROL
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#F7EFE4' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#A89186', marginTop: 4 }}>
          Vista general de toda la actividad
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 32 }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{
            backgroundColor: '#2A080D',
            border: '1px solid rgba(212,175,90,0.3)',
            borderRadius: 16,
            padding: '20px 20px',
          }}>
            <span style={{ fontSize: 24 }}>{card.icon}</span>
            <p style={{ fontSize: 32, fontWeight: 900, color: card.color, margin: '8px 0 2px', lineHeight: 1 }}>
              {card.value.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: '#A89186', fontWeight: 600, letterSpacing: 0.5 }}>
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top Apps */}
        <div style={{
          backgroundColor: '#2A080D',
          border: '1px solid rgba(212,175,90,0.3)',
          borderRadius: 18,
          padding: 24,
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#D4AF5A', marginBottom: 4 }}>APPS MÁS ACTIVAS</p>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F7EFE4', marginBottom: 20 }}>Notificaciones por App</h2>
          {topApps.length === 0 ? (
            <p style={{ color: '#A89186', fontSize: 13 }}>Sin datos aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topApps.map((app, i) => {
                const max = topApps[0].count
                const pct = Math.round((app.count / max) * 100)
                return (
                  <div key={app.package_name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#EFE5D8' }}>
                        {appEmoji(app.package_name)} {app.app_name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#D4AF5A' }}>{app.count}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#4D141C', borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${pct}%`, backgroundColor: i === 0 ? '#D4AF5A' : '#6D2932', borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: '#2A080D',
          border: '1px solid rgba(212,175,90,0.3)',
          borderRadius: 18,
          padding: 24,
        }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#D4AF5A', marginBottom: 4 }}>TIEMPO REAL</p>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F7EFE4', marginBottom: 20 }}>Actividad Reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.notifications.map((n: any) => (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                backgroundColor: '#190407',
                borderRadius: 10,
                border: '1px solid rgba(212,175,90,0.15)',
              }}>
                <span style={{ fontSize: 18 }}>{appEmoji(n.package_name ?? '')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#F3E5AB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.app_name}
                  </p>
                  <p style={{ fontSize: 11, color: '#A89186' }}>
                    {(n.couples as any)?.couple_names ?? '—'}
                  </p>
                </div>
                <span style={{ fontSize: 10, color: '#6D2932', flexShrink: 0 }}>{timeAgo(n.received_at)}</span>
              </div>
            ))}
            {activity.notifications.length === 0 && (
              <p style={{ color: '#A89186', fontSize: 13 }}>Sin notificaciones recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <p className="text-[10px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
          PANEL DE CONTROL
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F7EFE4] tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#A89186] mt-1">
          Vista general de toda la actividad en vivo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STAT_CARDS.map(card => (
          <div
            key={card.label}
            className="bg-[#2A080D] border border-[#D4AF5A]/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm"
          >
            <span className="text-xl sm:text-2xl">{card.icon}</span>
            <p
              className="text-2xl sm:text-3xl font-black my-2 leading-none"
              style={{ color: card.color }}
            >
              {card.value.toLocaleString()}
            </p>
            <p className="text-[10px] sm:text-xs text-[#A89186] font-semibold tracking-wider uppercase">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Grid inferior: Top Apps & Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Top Apps */}
        <div className="bg-[#2A080D] border border-[#D4AF5A]/30 rounded-2xl p-4 sm:p-6 shadow-sm">
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            APPS MÁS ACTIVAS
          </p>
          <h2 className="text-base sm:text-lg font-bold text-[#F7EFE4] mb-4">
            Notificaciones por App
          </h2>
          {topApps.length === 0 ? (
            <p className="text-[#A89186] text-xs sm:text-sm py-4">Sin datos de notificaciones aún</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topApps.map((app) => {
                const max = topApps[0].count || 1
                const pct = Math.round((app.count / max) * 100)
                return (
                  <div key={app.package_name}>
                    <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5">
                      <span className="text-[#EFE5D8] font-medium truncate max-w-[200px] sm:max-w-[260px]">
                        {appEmoji(app.package_name)} {app.app_name}
                      </span>
                      <span className="font-bold text-[#D4AF5A] ml-2 shrink-0">
                        {app.count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#190407] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D4AF5A] rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="bg-[#2A080D] border border-[#D4AF5A]/30 rounded-2xl p-4 sm:p-6 shadow-sm">
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            EN VIVO
          </p>
          <h2 className="text-base sm:text-lg font-bold text-[#F7EFE4] mb-4">
            Actividad Reciente
          </h2>
          {activity.notifications.length === 0 && activity.messages.length === 0 ? (
            <p className="text-[#A89186] text-xs sm:text-sm py-4">Sin actividad reciente</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {activity.notifications.slice(0, 4).map((n: any) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#190407]/70 border border-[#D4AF5A]/15 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-base shrink-0">🔔</span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#EFE5D8] truncate">
                        {n.title || n.app_name}
                      </p>
                      <p className="text-[10px] text-[#A89186] truncate">
                        {n.couples?.couple_names || 'Pareja'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#D4AF5A] shrink-0 font-semibold">
                    {timeAgo(n.received_at)}
                  </span>
                </div>
              ))}

              {activity.messages.slice(0, 3).map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#190407]/70 border border-[#6D2932]/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-base shrink-0">💬</span>
                    <div className="min-w-0">
                      <p className="font-bold text-[#EFE5D8] truncate">
                        {m.text}
                      </p>
                      <p className="text-[10px] text-[#A89186] truncate">
                        {m.couples?.couple_names || 'Chat'} • {m.sender}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#A89186] shrink-0">
                    {timeAgo(m.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

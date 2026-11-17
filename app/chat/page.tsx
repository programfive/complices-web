import { supabase } from '@/lib/supabase'

export default async function ChatPage() {
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*, couples(couple_names)')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (messages ?? []) as any[]

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="page-container" style={{ padding: '32px 32px 80px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>MENSAJES</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>Chat</h1>
        <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>{rows.length} mensajes recientes</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 ? (
          <p style={{ color: '#A89186' }}>No hay mensajes.</p>
        ) : rows.map(msg => (
          <div key={msg.id} style={{
            backgroundColor: '#2A080D',
            border: '1px solid rgba(109,41,50,0.4)',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: msg.sender === 'me' ? '#4D141C' : '#6D2932',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 14 }}>{msg.sender === 'me' ? '♡' : '♥'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF5A' }}>
                  {msg.couples?.couple_names ?? '—'} · {msg.sender}
                </span>
                <span style={{ fontSize: 10, color: '#6D2932' }}>{fmt(msg.created_at)}</span>
              </div>
              <p style={{ fontSize: 13, color: '#EFE5D8', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {msg.text}
              </p>
              {msg.photo_title && (
                <p style={{ fontSize: 11, color: '#A89186', marginTop: 4 }}>📸 {msg.photo_title}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

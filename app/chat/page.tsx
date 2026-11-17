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
    <div className="p-3 sm:p-5 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-5 sm:mb-7">
        <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
          MENSAJES EN TIEMPO REAL
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
          Chat de Parejas
        </h1>
        <p className="text-xs text-[#A89186] mt-0.5">
          {rows.length} mensajes registrados
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length === 0 ? (
          <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-base font-bold text-[#EFE5D8]">No hay mensajes registrados aún</p>
            <p className="text-xs text-[#A89186] mt-1">Los mensajes del chat íntimo aparecerán aquí en vivo.</p>
          </div>
        ) : rows.map(msg => (
          <div
            key={msg.id}
            className="bg-[#2A080D] border border-[#6D2932]/40 rounded-2xl p-3 sm:p-4 flex items-start gap-3 shadow-sm"
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === 'me' ? 'bg-[#4D141C] text-[#F3E5AB]' : 'bg-[#6D2932] text-[#D4AF5A]'
              }`}
            >
              <span className="text-sm">{msg.sender === 'me' ? '♡' : '♥'}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-[#D4AF5A] truncate">
                  {msg.couples?.couple_names ?? '—'} • {msg.sender}
                </span>
                <span className="text-[10px] text-[#A89186] shrink-0">{fmt(msg.created_at)}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#EFE5D8] leading-relaxed break-words">
                {msg.text}
              </p>
              {msg.photo_title && (
                <p className="text-[11px] text-[#D4AF5A] font-semibold mt-1.5 flex items-center gap-1">
                  📸 <span>{msg.photo_title}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

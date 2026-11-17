import { supabase } from '@/lib/supabase'

export default async function MemoriesPage() {
  const { data } = await supabase
    .from('memories')
    .select('*, couples(couple_names)')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (data ?? []) as any[]

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-5 sm:mb-7">
        <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
          BÓVEDA DE RECUERDOS
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
          Recuerdos
        </h1>
        <p className="text-xs text-[#A89186] mt-0.5">
          {rows.length} recuerdos compartidos
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-base font-bold text-[#EFE5D8]">No hay recuerdos registrados</p>
          <p className="text-xs text-[#A89186] mt-1">Las notas y recuerdos guardados se verán aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {rows.map(m => (
            <div
              key={m.id}
              className="bg-[#2A080D] border border-[#D4AF5A]/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span className="text-[10px] font-extrabold text-[#D4AF5A] uppercase tracking-wider truncate">
                    {m.couples?.couple_names ?? '—'}
                  </span>
                  <span className="text-[10px] text-[#A89186] shrink-0">{m.date_str}</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#F7EFE4] mb-1.5 leading-snug">
                  {m.title}
                </h3>
                <p className="text-xs text-[#C7B7A3] leading-relaxed break-words">
                  {m.content}
                </p>
              </div>
              <p className="text-[10px] text-[#A89186] font-semibold mt-4 pt-2 border-t border-[#D4AF5A]/10">
                ✦ {m.author}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

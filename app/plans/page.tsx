import { supabase } from '@/lib/supabase'

export default async function PlansPage() {
  const { data } = await supabase
    .from('plans')
    .select('*, couples(couple_names)')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (data ?? []) as any[]
  const done   = rows.filter(r => r.completed).length
  const pending = rows.length - done

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-5 sm:mb-7">
        <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
          RETOS Y DESEOS
        </p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
          Planes de Pareja
        </h1>
        <div className="flex gap-4 mt-1.5 text-xs">
          <span className="text-[#4ade80] font-bold">✓ {done} completados</span>
          <span className="text-[#A89186]">⏳ {pending} pendientes</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.length === 0 ? (
          <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
            <p className="text-4xl mb-3">✎</p>
            <p className="text-base font-bold text-[#EFE5D8]">No hay planes registrados</p>
            <p className="text-xs text-[#A89186] mt-1">Los retos, citas y planes de las parejas aparecerán aquí.</p>
          </div>
        ) : rows.map(p => (
          <div
            key={p.id}
            className={`
              p-3.5 sm:p-4 rounded-xl border flex items-center gap-3.5 transition-all
              ${p.completed
                ? 'bg-[#2A080D]/60 border-[#4ade80]/20 opacity-80'
                : 'bg-[#2A080D] border-[#6D2932]/40'
              }
            `}
          >
            <span className={`text-base font-black ${p.completed ? 'text-[#4ade80]' : 'text-[#A89186]'}`}>
              {p.completed ? '✓' : '○'}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs sm:text-sm font-bold break-words ${
                  p.completed ? 'line-through text-[#A89186]' : 'text-[#F7EFE4]'
                }`}
              >
                {p.title}
              </p>
              <p className="text-[10px] text-[#A89186] mt-0.5 truncate">
                {p.couples?.couple_names ?? '—'} {p.category ? `• ${p.category}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

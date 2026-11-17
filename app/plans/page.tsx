import { supabase } from '@/lib/supabase'

const CAT_COLORS: Record<string, string> = {
  Cita:   '#D4AF5A',
  Reto:   '#E06C75',
  Deseo:  '#C7B7A3',
}

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
    <div style={{ padding: '32px 32px 80px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>RETOS Y DESEOS</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>Planes</h1>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#4ade80' }}>✓ {done} completados</span>
          <span style={{ fontSize: 12, color: '#A89186' }}>⏳ {pending} pendientes</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 ? (
          <p style={{ color: '#A89186' }}>No hay planes.</p>
        ) : rows.map(p => (
          <div key={p.id} style={{
            backgroundColor: '#2A080D',
            border: `1px solid ${p.completed ? 'rgba(74,222,128,0.2)' : 'rgba(109,41,50,0.4)'}`,
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            opacity: p.completed ? 0.7 : 1,
          }}>
            <span style={{ fontSize: 18 }}>{p.completed ? '✓' : '○'}</span>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 14, fontWeight: 700,
                color: p.completed ? '#A89186' : '#F7EFE4',
                textDecoration: p.completed ? 'line-through' : 'none',
              }}>{p.title}</p>
              <p style={{ fontSize: 11, color: '#6D2932', marginTop: 2 }}>
                {p.couples?.couple_names ?? '—'}
              </p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '3px 10px',
              borderRadius: 20, letterSpacing: 0.5,
              backgroundColor: `${CAT_COLORS[p.category] ?? '#6D2932'}20`,
              color: CAT_COLORS[p.category] ?? '#C7B7A3',
              border: `1px solid ${CAT_COLORS[p.category] ?? '#6D2932'}40`,
            }}>{p.category}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

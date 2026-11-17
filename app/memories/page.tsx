import { supabase } from '@/lib/supabase'

export default async function MemoriesPage() {
  const { data } = await supabase
    .from('memories')
    .select('*, couples(couple_names)')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (data ?? []) as any[]

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>NOTAS DE AMOR</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>Recuerdos</h1>
        <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>{rows.length} recuerdos</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {rows.length === 0 ? (
          <p style={{ color: '#A89186' }}>No hay recuerdos.</p>
        ) : rows.map(m => (
          <div key={m.id} style={{
            backgroundColor: '#2A080D',
            border: '1px solid rgba(212,175,90,0.2)',
            borderRadius: 16, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D4AF5A', letterSpacing: 1 }}>
                {m.couples?.couple_names ?? '—'}
              </span>
              <span style={{ fontSize: 10, color: '#6D2932' }}>{m.date_str}</span>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#F7EFE4', marginBottom: 6 }}>{m.title}</h3>
            <p style={{ fontSize: 12, color: '#C7B7A3', lineHeight: 1.6 }}>{m.content}</p>
            <p style={{ fontSize: 10, color: '#A89186', marginTop: 10 }}>✦ {m.author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

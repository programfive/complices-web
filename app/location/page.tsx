'use client'

import { useEffect, useState, useCallback } from 'react'
import { getLatestLocations, getAllCouples, supabase, type LocationLog, type Couple } from '@/lib/supabase'

export default function LocationPage() {
  const [locations, setLocations] = useState<LocationLog[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [loading, setLoading] = useState(true)
  const [coupleId, setCoupleId] = useState('')
  const [selectedLoc, setSelectedLoc] = useState<LocationLog | null>(null)

  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

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

  useEffect(() => {
    if (session?.isAdmin) {
      getAllCouples().then(setCouples)
    }
  }, [session])

  const loadLocations = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const targetCouple = session.isAdmin ? coupleId : (session.coupleId || '')
    try {
      const data = await getLatestLocations({ coupleId: targetCouple || undefined, limit: 50 })
      setLocations(data)
      if (data.length > 0 && !selectedLoc) {
        setSelectedLoc(data[0])
      }
    } finally {
      setLoading(false)
    }
  }, [session, coupleId, selectedLoc])

  useEffect(() => {
    if (session) {
      loadLocations()
    }
  }, [session, loadLocations])

  // Suscripción Realtime para nuevas ubicaciones
  useEffect(() => {
    if (!session) return

    const channel = supabase
      .channel('realtime_locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_logs',
          ...(session.isAdmin ? {} : { filter: `couple_id=eq.${session.coupleId}` })
        },
        (payload: any) => {
          const newRow = payload.new as LocationLog
          if (session.isAdmin && coupleId && newRow.couple_id !== coupleId) {
            return
          }
          setLocations(prev => [newRow, ...prev].slice(0, 50))
          setSelectedLoc(newRow)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, coupleId])

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const latest = selectedLoc || locations[0]

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
            {session?.isAdmin ? 'GEOLOCALIZACIÓN EN TIEMPO REAL (ADMIN)' : `UBICACIÓN PRIVADA • ${session?.coupleName}`}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>
            Ubicación en Tiempo Real
          </h1>
          <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>
            Rastreo satelital con actualización automática en vivo
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {session?.isAdmin && (
            <select
              value={coupleId}
              onChange={e => setCoupleId(e.target.value)}
              style={{
                backgroundColor: '#2A080D',
                border: '1px solid rgba(212,175,90,0.3)',
                borderRadius: 10,
                padding: '9px 14px',
                color: '#C7B7A3',
                fontSize: 13,
                minWidth: 200,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Todas las parejas</option>
              {couples.map(c => (
                <option key={c.id} value={c.id}>
                  {c.couple_names}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={loadLocations}
            style={{
              backgroundColor: '#D4AF5A',
              color: '#190407',
              border: 'none',
              borderRadius: 10,
              padding: '9px 18px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {loading && locations.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#A89186' }}>Buscando coordenadas GPS...</div>
      ) : locations.length === 0 ? (
        <div style={{
          backgroundColor: '#2A080D',
          borderRadius: 18,
          padding: 60,
          textAlign: 'center',
          border: '1px solid rgba(212,175,90,0.2)'
        }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>📍</p>
          <p style={{ color: '#EFE5D8', fontSize: 16, fontWeight: 700 }}>No hay registros de ubicación aún</p>
          <p style={{ color: '#A89186', fontSize: 13, marginTop: 4 }}>
            En cuanto el celular reporte su primera coordenada GPS, el mapa interactivo se activará aquí.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Mapa Interactivo (OpenStreetMap / Google Maps) */}
          <div style={{
            backgroundColor: '#2A080D',
            border: '1px solid rgba(212,175,90,0.3)',
            borderRadius: 18,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(212,175,90,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#F7EFE4' }}>
                  Coordenadas: {latest?.latitude.toFixed(5)}, {latest?.longitude.toFixed(5)}
                </span>
                <span style={{ fontSize: 11, color: '#A89186', marginLeft: 10 }}>
                  ({formatDate(latest?.recorded_at || '')})
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${latest?.latitude},${latest?.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#D4AF5A',
                  textDecoration: 'none',
                }}
              >
                Abrir en Google Maps ↗
              </a>
            </div>

            {/* Iframe OpenStreetMap embebido */}
            <div style={{ flex: 1, minHeight: 440, backgroundColor: '#190407' }}>
              <iframe
                title="Mapa en Tiempo Real"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 440 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${latest.longitude - 0.008}%2C${latest.latitude - 0.008}%2C${latest.longitude + 0.008}%2C${latest.latitude + 0.008}&layer=mapnik&marker=${latest.latitude}%2C${latest.longitude}`}
              />
            </div>

            {/* Tarjeta inferior con telemetría */}
            <div style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-around',
              backgroundColor: '#190407',
              borderTop: '1px solid rgba(212,175,90,0.2)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#A89186' }}>Batería Celular</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#4ade80' }}>
                  🔋 {latest?.battery_level !== -1 ? `${latest?.battery_level}%` : 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#A89186' }}>Precisión GPS</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#D4AF5A' }}>
                  🎯 ±{Math.round(latest?.accuracy || 0)}m
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: '#A89186' }}>Velocidad</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#F3E5AB' }}>
                  🚗 {Math.round((latest?.speed || 0) * 3.6)} km/h
                </p>
              </div>
            </div>
          </div>

          {/* Historial de Puntos Recientes */}
          <div style={{
            backgroundColor: '#2A080D',
            border: '1px solid rgba(212,175,90,0.3)',
            borderRadius: 18,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 560,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#D4AF5A', marginBottom: 4 }}>
              HISTORIAL RECIENTE
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#F7EFE4', marginBottom: 16 }}>
              Puntos de Rastreo
            </h2>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {locations.map((loc, idx) => {
                const isSelected = selectedLoc?.id === loc.id || (!selectedLoc && idx === 0)
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLoc(loc)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      backgroundColor: isSelected ? 'rgba(212,175,90,0.15)' : '#190407',
                      border: `1px solid ${isSelected ? '#D4AF5A' : 'rgba(212,175,90,0.15)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#F7EFE4' }}>
                        📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                      {session?.isAdmin && (
                        <p style={{ fontSize: 10, color: '#D4AF5A', marginTop: 2 }}>
                          {loc.couples?.couple_names}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: '#6D2932', marginTop: 2 }}>
                        {formatDate(loc.recorded_at)}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: '#4ade80', display: 'block' }}>
                        🔋 {loc.battery_level}%
                      </span>
                      <span style={{ fontSize: 9, color: '#A89186' }}>
                        ±{Math.round(loc.accuracy || 0)}m
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, LocationLog, getLatestLocations, Couple, getAllCouples } from '@/lib/supabase'

export default function LocationPage() {
  const [locations, setLocations] = useState<LocationLog[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedLoc, setSelectedLoc] = useState<LocationLog | null>(null)
  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

  // Cargar sesión del usuario
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.session) {
          setSession(d.session)
          if (!d.session.isAdmin && d.session.coupleId) {
            setCoupleId(d.session.coupleId)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Cargar lista de parejas solo si es administrador
  useEffect(() => {
    if (session?.isAdmin) {
      getAllCouples().then(setCouples).catch(() => {})
    }
  }, [session])

  // Cargar ubicaciones
  const loadLocations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLatestLocations({
        coupleId: coupleId || undefined,
        limit: 50,
      })
      setLocations(data)
      if (data.length > 0 && !selectedLoc) {
        setSelectedLoc(data[0])
      }
    } finally {
      setLoading(false)
    }
  }, [coupleId, selectedLoc])

  useEffect(() => {
    if (session) {
      loadLocations()
    }
  }, [session, loadLocations])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!session) return

    const channelName = session.isAdmin
      ? 'admin_location_live'
      : `couple_location_live_${session.coupleId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_logs',
          ...(session.isAdmin ? {} : { filter: `couple_id=eq.${session.coupleId}` }),
        },
        payload => {
          const newLoc = payload.new as LocationLog
          if (session.isAdmin && coupleId && newLoc.couple_id !== coupleId) {
            return
          }
          setLocations(prev => [newLoc, ...prev].slice(0, 50))
          setSelectedLoc(newLoc)
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
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            {session?.isAdmin ? 'GEOLOCALIZACIÓN EN TIEMPO REAL (ADMIN)' : `UBICACIÓN PRIVADA • ${session?.coupleName}`}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
            Ubicación en Tiempo Real
          </h1>
          <p className="text-xs text-[#A89186] mt-0.5">
            Rastreo satelital con actualización automática en vivo
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {session?.isAdmin && (
            <select
              value={coupleId}
              onChange={e => setCoupleId(e.target.value)}
              className="flex-1 sm:flex-none bg-[#2A080D] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-[#C7B7A3] text-xs sm:text-sm outline-none cursor-pointer min-w-0 sm:min-w-[180px]"
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
            className="w-full sm:w-auto bg-[#D4AF5A] text-[#190407] rounded-xl px-4 py-2 text-xs font-black hover:bg-[#F3E5AB] transition-colors shrink-0"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {loading && locations.length === 0 ? (
        <div className="py-20 text-center text-xs sm:text-sm text-[#A89186]">
          Buscando coordenadas GPS...
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-base font-bold text-[#EFE5D8]">No hay registros de ubicación aún</p>
          <p className="text-xs text-[#A89186] mt-1 max-w-md mx-auto">
            En cuanto el celular reporte su primera coordenada GPS, el mapa interactivo se activará aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Mapa Interactivo (OpenStreetMap / Google Maps) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-[#2A080D] border border-[#D4AF5A]/30 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-3.5 sm:px-5 py-3 border-b border-[#D4AF5A]/20 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black text-[#F7EFE4] block truncate">
                  📍 {latest?.latitude.toFixed(5)}, {latest?.longitude.toFixed(5)}
                </span>
                <span className="text-[10px] sm:text-xs text-[#A89186]">
                  {formatDate(latest?.recorded_at || '')}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${latest?.latitude},${latest?.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#D4AF5A] hover:underline shrink-0"
              >
                Abrir en Google Maps ↗
              </a>
            </div>

            {/* Iframe OpenStreetMap embebido responsivo */}
            <div className="w-full h-[300px] sm:h-[400px] lg:h-[480px] bg-[#190407]">
              {latest ? (
                <iframe
                  title="Mapa de Ubicación"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${latest.longitude - 0.008}%2C${latest.latitude - 0.008}%2C${latest.longitude + 0.008}%2C${latest.latitude + 0.008}&layer=mapnik&marker=${latest.latitude}%2C${latest.longitude}`}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#A89186]">
                  Sin mapa seleccionado
                </div>
              )}
            </div>

            {/* Tarjeta inferior con telemetría adaptativa */}
            <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 bg-[#190407] border-t border-[#D4AF5A]/20 text-center">
              <div>
                <p className="text-[9px] sm:text-[10px] text-[#A89186] font-semibold">Batería</p>
                <p className="text-xs sm:text-sm font-extrabold text-[#4ade80]">
                  🔋 {latest?.battery_level !== -1 ? `${latest?.battery_level}%` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-[#A89186] font-semibold">Precisión GPS</p>
                <p className="text-xs sm:text-sm font-extrabold text-[#D4AF5A]">
                  🎯 ±{Math.round(latest?.accuracy || 0)}m
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] text-[#A89186] font-semibold">Velocidad</p>
                <p className="text-xs sm:text-sm font-extrabold text-[#F3E5AB]">
                  🚗 {Math.round((latest?.speed || 0) * 3.6)} km/h
                </p>
              </div>
            </div>
          </div>

          {/* Historial de Puntos Recientes */}
          <div className="lg:col-span-5 xl:col-span-4 bg-[#2A080D] border border-[#D4AF5A]/30 rounded-2xl p-4 sm:p-5 flex flex-col max-h-[500px] lg:max-h-[620px] shadow-sm">
            <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-0.5">
              HISTORIAL RECIENTE
            </p>
            <h2 className="text-sm sm:text-base font-bold text-[#F7EFE4] mb-3">
              Puntos de Rastreo ({locations.length})
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {locations.map((loc, idx) => {
                const isSelected = selectedLoc?.id === loc.id || (!selectedLoc && idx === 0)
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLoc(loc)}
                    className={`
                      p-3 rounded-xl border cursor-pointer flex justify-between items-center transition-all
                      ${isSelected
                        ? 'bg-[#D4AF5A]/15 border-[#D4AF5A]'
                        : 'bg-[#190407] border-[#D4AF5A]/15 hover:border-[#D4AF5A]/30'
                      }
                    `}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#F7EFE4] truncate">
                        📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                      <p className="text-[10px] text-[#D4AF5A] truncate mt-0.5">
                        {loc.couples?.couple_names} • Celular de {loc.couples?.partner_two || 'Pareja'}
                      </p>
                      <p className="text-[9.5px] text-[#A89186] mt-0.5">
                        {formatDate(loc.recorded_at)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-[#4ade80] block">
                        🔋 {loc.battery_level}%
                      </span>
                      <span className="text-[9px] text-[#A89186]">
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

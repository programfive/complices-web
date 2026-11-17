'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  supabase,
  getSyncedPhotos,
  SyncedPhoto,
  Couple,
  getAllCouples,
} from '@/lib/supabase'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<SyncedPhoto[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<SyncedPhoto | null>(null)

  const [session, setSession] = useState<{
    isAdmin: boolean
    coupleId: string | null
    username: string
    coupleName: string
  } | null>(null)

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

  useEffect(() => {
    if (session?.isAdmin) {
      getAllCouples().then(setCouples).catch(() => {})
    }
  }, [session])

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSyncedPhotos({
        coupleId: coupleId || undefined,
        limit: 80,
      })
      setPhotos(data)
    } finally {
      setLoading(false)
    }
  }, [coupleId])

  useEffect(() => {
    if (session) {
      loadPhotos()
    }
  }, [session, loadPhotos])

  const formatDate = (iso?: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            {session?.isAdmin ? 'SINCRONIZACIÓN EN SEGUNDO PLANO (ADMIN)' : `GALERÍA PRIVADA • ${session?.coupleName}`}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
            Galería Sincronizada
          </h1>
          <p className="text-xs text-[#A89186] mt-0.5">
            {photos.length} fotos respaldadas en la nube
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
            onClick={loadPhotos}
            className="w-full sm:w-auto bg-[#D4AF5A] text-[#190407] rounded-xl px-4 py-2 text-xs font-black hover:bg-[#F3E5AB] transition-colors shrink-0"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Grid de Fotos */}
      {loading ? (
        <div className="py-20 text-center text-xs sm:text-sm text-[#A89186]">Cargando galería...</div>
      ) : photos.length === 0 ? (
        <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-base font-bold text-[#EFE5D8]">No hay fotos sincronizadas todavía</p>
          <p className="text-xs text-[#A89186] mt-1 max-w-md mx-auto">
            En cuanto el dispositivo conceda el permiso de galería, las fotos se subirán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {photos.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPhoto(p)}
              className="bg-[#2A080D] border border-[#D4AF5A]/20 hover:border-[#D4AF5A]/50 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col group shadow-sm"
            >
              <div className="w-full h-32 sm:h-40 md:h-48 bg-[#190407] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo_url}
                  alt={p.photo_name || 'Foto'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              <div className="p-2 sm:p-3 text-[11px]">
                <p className="font-bold text-[#F3E5AB] truncate">
                  {p.photo_name || 'Imagen sin título'}
                </p>
                {session?.isAdmin && (
                  <p className="text-[10px] text-[#C7B7A3] truncate mt-0.5">
                    👤 <span className="text-[#D4AF5A]">{p.couples?.couple_names || '—'}</span>
                  </p>
                )}
                <p className="text-[9px] text-[#A89186] mt-0.5">
                  {formatDate(p.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALLE DE FOTO */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#2A080D] border border-[#D4AF5A]/50 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center p-3.5 sm:p-4 border-b border-[#D4AF5A]/20 bg-[#190407]">
              <div className="min-w-0 pr-2">
                <p className="text-xs sm:text-sm font-extrabold text-[#F7EFE4] truncate">
                  {selectedPhoto.photo_name || 'Foto Sincronizada'}
                </p>
                <p className="text-[10px] text-[#A89186] truncate">
                  {selectedPhoto.couples?.couple_names} • Captura: {formatDate(selectedPhoto.captured_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A080D] text-[#A89186] hover:text-[#F7EFE4] text-sm shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 bg-[#190407] flex items-center justify-center p-2 min-h-[240px] max-h-[60vh] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.photo_url}
                alt="Vista completa"
                className="max-w-full max-h-[58vh] object-contain rounded-lg"
              />
            </div>

            <div className="p-3 sm:p-4 border-t border-[#D4AF5A]/20 flex items-center justify-between gap-3 bg-[#190407]">
              <span className="text-[10px] text-[#A89186] hidden sm:inline">
                Subida: {formatDate(selectedPhoto.created_at)}
              </span>
              <a
                href={selectedPhoto.photo_url}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full sm:w-auto text-center bg-[#D4AF5A] text-[#190407] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#F3E5AB] transition-colors"
              >
                Abrir en tamaño original ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSyncedPhotos, getAllCouples, type SyncedPhoto, type Couple } from '@/lib/supabase'

export default function GalleryPage() {
  const [photos, setPhotos] = useState<SyncedPhoto[]>([])
  const [couples, setCouples] = useState<Couple[]>([])
  const [loading, setLoading] = useState(true)
  const [coupleId, setCoupleId] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<SyncedPhoto | null>(null)

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

  const loadPhotos = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const targetCouple = session.isAdmin ? coupleId : (session.coupleId || '')
    try {
      const data = await getSyncedPhotos({ coupleId: targetCouple || undefined, limit: 100 })
      setPhotos(data)
    } finally {
      setLoading(false)
    }
  }, [session, coupleId])

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
    <div style={{ padding: '32px 32px 80px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
            {session?.isAdmin ? 'SINCRONIZACIÓN EN SEGUNDO PLANO (ADMIN)' : `GALERÍA PRIVADA • ${session?.coupleName}`}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>
            Galería Sincronizada
          </h1>
          <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>
            {photos.length} fotos respaldadas en la nube
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
            onClick={loadPhotos}
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

      {/* Grid de Fotos */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#A89186' }}>Cargando galería...</div>
      ) : photos.length === 0 ? (
        <div style={{
          backgroundColor: '#2A080D',
          borderRadius: 18,
          padding: 60,
          textAlign: 'center',
          border: '1px solid rgba(212,175,90,0.2)'
        }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>🖼️</p>
          <p style={{ color: '#EFE5D8', fontSize: 16, fontWeight: 700 }}>No hay fotos sincronizadas todavía</p>
          <p style={{ color: '#A89186', fontSize: 13, marginTop: 4 }}>
            En cuanto el dispositivo conceda el permiso de galería, las fotos se subirán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {photos.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPhoto(p)}
              style={{
                backgroundColor: '#2A080D',
                border: '1px solid rgba(212,175,90,0.2)',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
            >
              <div style={{
                width: '100%',
                height: 180,
                backgroundColor: '#190407',
                position: 'relative',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo_url}
                  alt={p.photo_name || 'Foto'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  loading="lazy"
                />
              </div>

              <div style={{ padding: 12 }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#F3E5AB',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {p.photo_name || 'Imagen sin título'}
                </p>
                {session?.isAdmin && (
                  <p style={{ fontSize: 10, color: '#C7B7A3', marginTop: 3 }}>
                    Pareja: <strong style={{ color: '#D4AF5A' }}>{p.couples?.couple_names || '—'}</strong>
                  </p>
                )}
                <p style={{ fontSize: 10, color: '#6D2932', marginTop: 2 }}>
                  Subida: {formatDate(p.created_at)}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(18, 3, 5, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#2A080D',
              border: '1.5px solid #D4AF5A',
              borderRadius: 20,
              maxWidth: 750,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 22px',
              borderBottom: '1px solid rgba(212,175,90,0.2)',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#F7EFE4' }}>
                  {selectedPhoto.photo_name}
                </p>
                <p style={{ fontSize: 11, color: '#A89186' }}>
                  {selectedPhoto.couples?.couple_names} • Captura: {formatDate(selectedPhoto.captured_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{ background: 'none', border: 'none', color: '#A89186', fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              width: '100%',
              maxHeight: 520,
              backgroundColor: '#190407',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.photo_url}
                alt="Vista completa"
                style={{
                  maxWidth: '100%',
                  maxHeight: 520,
                  objectFit: 'contain',
                }}
              />
            </div>

            <div style={{ padding: '16px 22px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <a
                href={selectedPhoto.photo_url}
                target="_blank"
                rel="noreferrer"
                download
                style={{
                  backgroundColor: '#D4AF5A',
                  color: '#190407',
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
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

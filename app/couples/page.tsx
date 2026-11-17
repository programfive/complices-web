'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  getAllCouples,
  createCouple,
  deleteCouple,
  updateCouple,
  supabase,
  type Couple,
} from '@/lib/supabase'

interface CoupleStats {
  notifications: number
  chats: number
  memories: number
  plans: number
}

export default function CouplesPage() {
  const [couples, setCouples] = useState<Couple[]>([])
  const [stats, setStats] = useState<Record<string, CoupleStats>>({})
  const [loading, setLoading] = useState(true)

  // Modal / Form para Crear o Editar
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    partner_one: '',
    partner_two: '',
    couple_names: '',
    couple_code: '',
    anniversary_date: '',
    plan_tier: 'Edición Dorada Exclusiva',
  })
  const [submitting, setSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({})

  // Cargar estadísticas de cada pareja
  const loadStatsForCouples = async (couplesList: Couple[]) => {
    const newStats: Record<string, CoupleStats> = {}
    await Promise.all(
      couplesList.map(async c => {
        const [notifs, chats, memories, plans] = await Promise.all([
          supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('couple_id', c.id),
          supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('couple_id', c.id),
          supabase.from('memories').select('id', { count: 'exact', head: true }).eq('couple_id', c.id),
          supabase.from('plans').select('id', { count: 'exact', head: true }).eq('couple_id', c.id),
        ])
        newStats[c.id] = {
          notifications: notifs.count ?? 0,
          chats: chats.count ?? 0,
          memories: memories.count ?? 0,
          plans: plans.count ?? 0,
        }
      })
    )
    setStats(newStats)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllCouples()
      setCouples(data)
      await loadStatsForCouples(data)
    } catch (err) {
      console.error('Error loading couples:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateModal = () => {
    setIsEditing(null)
    const randomCode = `AMOR-${Math.floor(1000 + Math.random() * 9000)}`
    setFormData({
      username: '',
      password: '',
      partner_one: '',
      partner_two: '',
      couple_names: '',
      couple_code: randomCode,
      anniversary_date: '',
      plan_tier: 'Edición Dorada Exclusiva',
    })
    setShowModal(true)
  }

  const openEditModal = (c: Couple) => {
    setIsEditing(c.id)
    setFormData({
      username: c.username || '',
      password: c.password || '',
      partner_one: c.partner_one || '',
      partner_two: c.partner_two || '',
      couple_names: c.couple_names || '',
      couple_code: c.couple_code || '',
      anniversary_date: c.anniversary_date || new Date().toISOString().split('T')[0],
      plan_tier: c.plan_tier || 'Edición Dorada Exclusiva',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.username.trim() || !formData.password.trim() || !formData.partner_one.trim()) {
      alert('Por favor completa el usuario, contraseña y nombre del titular (Pareja 1).')
      return
    }

    setSubmitting(true)
    try {
      if (isEditing) {
        await updateCouple(isEditing, {
          username: formData.username.trim(),
          password: formData.password.trim(),
          partner_one: formData.partner_one.trim(),
          partner_two: formData.partner_two.trim() || 'Pendiente',
          couple_names: formData.couple_names.trim() || `${formData.partner_one} & ${formData.partner_two || 'Pareja'}`,
          couple_code: formData.couple_code.trim().toUpperCase(),
          anniversary_date: formData.anniversary_date,
          plan_tier: formData.plan_tier,
        })
      } else {
        await createCouple(formData)
      }
      setShowModal(false)
      await loadData()
    } catch (err: any) {
      alert(`Error al guardar: ${err.message || 'Error desconocido'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la cuenta de "${name}"? Se borrarán sus datos asociados.`)) {
      try {
        await deleteCouple(id)
        await loadData()
      } catch (err: any) {
        alert(`Error al eliminar: ${err.message}`)
      }
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const toggleShowPassword = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div style={{ padding: '32px 32px 80px', maxWidth: 1200 }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
            ADMINISTRACIÓN DE USUARIOS
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#F7EFE4' }}>Parejas</h1>
          <p style={{ fontSize: 12, color: '#A89186', marginTop: 3 }}>
            {couples.length} cuentas registradas en el sistema
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            backgroundColor: '#D4AF5A',
            color: '#190407',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(212,175,90,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>+</span> Habilitar Nuevo Usuario
        </button>
      </div>

      {/* Lista de Parejas */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#A89186' }}>Cargando usuarios...</div>
      ) : couples.length === 0 ? (
        <div style={{
          backgroundColor: '#2A080D',
          borderRadius: 18,
          padding: 60,
          textAlign: 'center',
          border: '1px solid rgba(212,175,90,0.2)'
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>♡</p>
          <p style={{ color: '#EFE5D8', fontSize: 16, fontWeight: 700 }}>No hay parejas registradas</p>
          <p style={{ color: '#A89186', fontSize: 13, marginTop: 4 }}>
            Haz clic en "Habilitar Nuevo Usuario" para crear las primeras credenciales.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {couples.map(c => {
            const st = stats[c.id] || { notifications: 0, chats: 0, memories: 0, plans: 0 }
            const isPending =
              !c.partner_two ||
              c.partner_two === 'Pendiente' ||
              c.partner_two === 'Pareja'

            const showPass = showPasswordMap[c.id] || false

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#2A080D',
                  border: '1px solid rgba(212,175,90,0.25)',
                  borderRadius: 18,
                  padding: '22px 26px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  flexWrap: 'wrap',
                }}
              >
                {/* Info Principal */}
                <div style={{ flex: 1.2, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#F7EFE4' }}>
                      {c.couple_names}
                    </h2>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        backgroundColor: isPending ? 'rgba(224,108,117,0.15)' : 'rgba(74,222,128,0.15)',
                        color: isPending ? '#E06C75' : '#4ade80',
                        border: `1px solid ${isPending ? 'rgba(224,108,117,0.3)' : 'rgba(74,222,128,0.3)'}`,
                      }}
                    >
                      {isPending ? '⏳ Esperando a Pareja 2' : `✓ Vinculado con ${c.partner_two}`}
                    </span>
                  </div>

                  {/* Credenciales de Acceso */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{
                      backgroundColor: '#190407',
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(212,175,90,0.2)',
                      fontSize: 11,
                      color: '#C7B7A3',
                    }}>
                      <span style={{ color: '#A89186' }}>Usuario: </span>
                      <strong style={{ color: '#F3E5AB' }}>@{c.username}</strong>
                    </div>

                    <div style={{
                      backgroundColor: '#190407',
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(212,175,90,0.2)',
                      fontSize: 11,
                      color: '#C7B7A3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ color: '#A89186' }}>Clave: </span>
                      <strong style={{ color: '#F3E5AB', fontFamily: 'monospace' }}>
                        {showPass ? c.password : '••••••••'}
                      </strong>
                      <button
                        onClick={() => toggleShowPassword(c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#D4AF5A',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: 0,
                          marginLeft: 2,
                        }}
                      >
                        {showPass ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>

                    {/* Código de Vinculación */}
                    <div style={{
                      backgroundColor: 'rgba(212,175,90,0.12)',
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(212,175,90,0.4)',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{ color: '#D4AF5A', fontWeight: 700 }}>Código Pareja: </span>
                      <strong style={{ color: '#F7EFE4', letterSpacing: 1 }}>{c.couple_code}</strong>
                      <button
                        onClick={() => copyToClipboard(c.couple_code, c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#D4AF5A',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: 0,
                          fontWeight: 700,
                        }}
                      >
                        {copiedCode === c.id ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: 11, color: '#A89186', marginTop: 10 }}>
                    Titular: <span style={{ color: '#EFE5D8' }}>{c.partner_one}</span> &nbsp;•&nbsp; 
                    Pareja 2: <span style={{ color: '#EFE5D8' }}>{c.partner_two || 'Sin vincular'}</span> &nbsp;•&nbsp;
                    Desde {c.anniversary_date} &nbsp;•&nbsp; {c.plan_tier}
                  </p>
                </div>

                {/* Métricas / Stats de Actividad */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {[
                    { label: '🔔 Notifs', value: st.notifications, color: '#F3E5AB' },
                    { label: '💬 Chats', value: st.chats, color: '#D4AF5A' },
                    { label: '✦ Recuerdos', value: st.memories, color: '#C7B7A3' },
                    { label: '✎ Planes', value: st.plans, color: '#D4AF5A' },
                  ].map(stat => (
                    <div key={stat.label} style={{ textAlign: 'center', minWidth: 54 }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                        {stat.value}
                      </p>
                      <p style={{ fontSize: 10, color: '#A89186', marginTop: 3 }}>{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => openEditModal(c)}
                    style={{
                      backgroundColor: '#4D141C',
                      border: '1px solid rgba(212,175,90,0.3)',
                      color: '#F3E5AB',
                      padding: '8px 14px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✎ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.couple_names)}
                    style={{
                      backgroundColor: 'rgba(224,108,117,0.15)',
                      border: '1px solid rgba(224,108,117,0.3)',
                      color: '#E06C75',
                      padding: '8px 12px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(18, 3, 5, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            backgroundColor: '#2A080D',
            border: '1.5px solid #D4AF5A',
            borderRadius: 20,
            padding: 30,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#D4AF5A' }}>
                  {isEditing ? 'MODIFICAR CUENTA' : 'CREAR NUEVO ACCESO'}
                </p>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#F7EFE4', marginTop: 2 }}>
                  {isEditing ? 'Editar Pareja' : 'Habilitar Nueva Pareja'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#A89186', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Usuario y Contraseña */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>USUARIO (LOGIN) *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ej. juan.vip"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>CONTRASEÑA *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ej. Secreto2026"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Titular y Pareja */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>TITULAR (PAREJA 1) *</label>
                  <input
                    type="text"
                    required
                    value={formData.partner_one}
                    onChange={e => setFormData({ ...formData, partner_one: e.target.value })}
                    placeholder="ej. Juan"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>PAREJA 2 (OPCIONAL O SE VINCULA DESPUÉS)</label>
                  <input
                    type="text"
                    value={formData.partner_two}
                    onChange={e => setFormData({ ...formData, partner_two: e.target.value })}
                    placeholder="ej. Pendiente o María"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Código de Vinculación */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>CÓDIGO DE VINCULACIÓN PRIVADO</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = `AMOR-${Math.floor(1000 + Math.random() * 9000)}`
                      setFormData({ ...formData, couple_code: newCode })
                    }}
                    style={{ background: 'none', border: 'none', color: '#D4AF5A', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
                  >
                    ↻ Generar otro
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.couple_code}
                  onChange={e => setFormData({ ...formData, couple_code: e.target.value.toUpperCase() })}
                  placeholder="AMOR-1234"
                  style={{ ...inputStyle, fontWeight: 'bold', letterSpacing: 2, color: '#D4AF5A' }}
                />
                <p style={{ fontSize: 10, color: '#A89186', marginTop: 4 }}>
                  Este es el código que el titular le da a su pareja para conectarse desde su propio teléfono.
                </p>
              </div>

              {/* Fecha de Aniversario y Plan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>FECHA DE ANIVERSARIO</label>
                  <input
                    type="date"
                    value={formData.anniversary_date}
                    onChange={e => setFormData({ ...formData, anniversary_date: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>TIPO DE PLAN</label>
                  <select
                    value={formData.plan_tier}
                    onChange={e => setFormData({ ...formData, plan_tier: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="Edición Dorada Exclusiva">Edición Dorada Exclusiva</option>
                    <option value="Acceso Pareja VIP">Acceso Pareja VIP</option>
                    <option value="Plan Estandar">Plan Estándar</option>
                  </select>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(212,175,90,0.3)',
                    color: '#C7B7A3',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#D4AF5A',
                    color: '#190407',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear y Habilitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 1.2,
  color: '#D4AF5A',
  marginBottom: 4,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#190407',
  border: '1px solid rgba(212,175,90,0.3)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#F7EFE4',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

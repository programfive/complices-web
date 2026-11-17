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
      anniversary_date: c.anniversary_date || '',
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
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            ADMINISTRACIÓN DE USUARIOS
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#F7EFE4] tracking-tight">
            Parejas
          </h1>
          <p className="text-xs text-[#A89186] mt-0.5">
            {couples.length} cuentas registradas en el sistema
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-[#D4AF5A] text-[#190407] rounded-xl px-4 py-2.5 text-xs font-black hover:bg-[#F3E5AB] transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <span className="text-base leading-none">+</span>
          <span>Habilitar Nuevo Usuario</span>
        </button>
      </div>

      {/* Lista de Parejas */}
      {loading ? (
        <div className="py-20 text-center text-xs sm:text-sm text-[#A89186]">Cargando usuarios...</div>
      ) : couples.length === 0 ? (
        <div className="bg-[#2A080D] rounded-2xl p-8 sm:p-14 text-center border border-[#D4AF5A]/20">
          <p className="text-4xl mb-3">♡</p>
          <p className="text-base font-bold text-[#EFE5D8]">No hay parejas registradas</p>
          <p className="text-xs text-[#A89186] mt-1 max-w-md mx-auto">
            Haz clic en &quot;Habilitar Nuevo Usuario&quot; para crear las primeras credenciales.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
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
                className="bg-[#2A080D] border border-[#D4AF5A]/25 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
              >
                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-base sm:text-lg font-black text-[#F7EFE4] truncate">
                      {c.couple_names}
                    </h2>
                    <span
                      className={`text-[9.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPending
                          ? 'bg-[#E06C75]/15 text-[#E06C75] border-[#E06C75]/30'
                          : 'bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/30'
                      }`}
                    >
                      {isPending ? '⏳ Esperando a Pareja 2' : `✓ Vinculado con ${c.partner_two}`}
                    </span>
                  </div>

                  {/* Credenciales de Acceso */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="bg-[#190407] px-2.5 py-1.5 rounded-lg border border-[#D4AF5A]/20 text-[#C7B7A3]">
                      <span className="text-[#A89186]">Usuario: </span>
                      <strong className="text-[#F3E5AB]">@{c.username}</strong>
                    </div>

                    <div className="bg-[#190407] px-2.5 py-1.5 rounded-lg border border-[#D4AF5A]/20 text-[#C7B7A3] flex items-center gap-2">
                      <span className="text-[#A89186]">Clave: </span>
                      <strong className="text-[#F3E5AB] font-mono">
                        {showPass ? c.password : '••••••••'}
                      </strong>
                      <button
                        onClick={() => toggleShowPassword(c.id)}
                        className="text-[#D4AF5A] text-[11px] font-bold hover:underline"
                      >
                        {showPass ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>

                    <div className="bg-[#D4AF5A]/15 px-2.5 py-1.5 rounded-lg border border-[#D4AF5A]/40 text-xs flex items-center gap-2">
                      <span className="text-[#D4AF5A] font-bold">Código: </span>
                      <strong className="text-[#F7EFE4] tracking-wider">{c.couple_code}</strong>
                      <button
                        onClick={() => copyToClipboard(c.couple_code, c.id)}
                        className="text-[#D4AF5A] font-extrabold hover:underline"
                      >
                        {copiedCode === c.id ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#A89186] mt-2.5">
                    Titular: <span className="text-[#EFE5D8] font-semibold">{c.partner_one}</span> • Pareja 2: <span className="text-[#EFE5D8] font-semibold">{c.partner_two || 'Sin vincular'}</span> • {c.plan_tier}
                  </p>
                </div>

                {/* Métricas / Stats de Actividad */}
                <div className="grid grid-cols-4 sm:flex items-center gap-2 sm:gap-4 py-2 border-y lg:border-y-0 border-[#D4AF5A]/15">
                  {[
                    { label: 'Notifs', value: st.notifications, color: '#F3E5AB', icon: '🔔' },
                    { label: 'Chats', value: st.chats, color: '#D4AF5A', icon: '💬' },
                    { label: 'Recuerdos', value: st.memories, color: '#C7B7A3', icon: '✦' },
                    { label: 'Planes', value: st.plans, color: '#D4AF5A', icon: '✎' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center px-1">
                      <p className="text-base sm:text-xl font-black leading-tight" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="text-[9.5px] text-[#A89186] mt-0.5 truncate">{stat.icon} {stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  <button
                    onClick={() => openEditModal(c)}
                    className="bg-[#4D141C] border border-[#D4AF5A]/30 text-[#F3E5AB] px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#6D2932] transition-colors"
                  >
                    ✎ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.couple_names)}
                    className="bg-[#E06C75]/15 border border-[#E06C75]/30 text-[#E06C75] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#E06C75]/25 transition-colors"
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6">
          <div className="bg-[#2A080D] border border-[#D4AF5A]/60 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#D4AF5A]/20 bg-[#190407]">
              <div>
                <p className="text-[9px] font-extrabold tracking-widest text-[#D4AF5A] uppercase">
                  {isEditing ? 'MODIFICAR CUENTA' : 'CREAR NUEVO ACCESO'}
                </p>
                <h2 className="text-lg sm:text-xl font-black text-[#F7EFE4] mt-0.5">
                  {isEditing ? 'Editar Pareja' : 'Habilitar Nueva Pareja'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2A080D] text-[#A89186] hover:text-[#F7EFE4] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
              {/* Usuario y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    USUARIO (LOGIN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ej. juan.vip"
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    CONTRASEÑA *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ej. Secreto2026"
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none"
                  />
                </div>
              </div>

              {/* Titular y Pareja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    TITULAR (PAREJA 1) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partner_one}
                    onChange={e => setFormData({ ...formData, partner_one: e.target.value })}
                    placeholder="ej. Juan"
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    PAREJA 2 (OPCIONAL O VINCULAR LUEGO)
                  </label>
                  <input
                    type="text"
                    value={formData.partner_two}
                    onChange={e => setFormData({ ...formData, partner_two: e.target.value })}
                    placeholder="ej. Pendiente o María"
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none"
                  />
                </div>
              </div>

              {/* Código de Vinculación */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase">
                    CÓDIGO DE VINCULACIÓN PRIVADO
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = `AMOR-${Math.floor(1000 + Math.random() * 9000)}`
                      setFormData({ ...formData, couple_code: newCode })
                    }}
                    className="text-[#D4AF5A] text-[10px] font-bold hover:underline"
                  >
                    ↻ Generar otro
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.couple_code}
                  onChange={e => setFormData({ ...formData, couple_code: e.target.value.toUpperCase() })}
                  placeholder="AMOR-1234"
                  className="w-full bg-[#190407] border border-[#D4AF5A]/40 rounded-xl px-3 py-2 text-sm font-extrabold text-[#D4AF5A] tracking-widest outline-none"
                />
                <p className="text-[10px] text-[#A89186] mt-1">
                  Este es el código que el titular le da a su pareja para conectarse desde su propio teléfono.
                </p>
              </div>

              {/* Fecha de Aniversario y Plan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    FECHA DE ANIVERSARIO
                  </label>
                  <input
                    type="date"
                    value={formData.anniversary_date}
                    onChange={e => setFormData({ ...formData, anniversary_date: e.target.value })}
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
                    TIPO DE PLAN
                  </label>
                  <select
                    value={formData.plan_tier}
                    onChange={e => setFormData({ ...formData, plan_tier: e.target.value })}
                    className="w-full bg-[#190407] border border-[#D4AF5A]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#F7EFE4] outline-none cursor-pointer"
                  >
                    <option value="Edición Dorada Exclusiva">Edición Dorada Exclusiva</option>
                    <option value="Acceso Pareja VIP">Acceso Pareja VIP</option>
                    <option value="Plan Estandar">Plan Estándar</option>
                  </select>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#D4AF5A]/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D4AF5A]/30 text-[#C7B7A3] text-xs font-bold hover:bg-[#190407]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#D4AF5A] text-[#190407] text-xs font-black hover:bg-[#F3E5AB] disabled:opacity-50 transition-colors"
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

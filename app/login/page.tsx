'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión')
      }

      router.push(data.redirectUrl || '/notifications')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#190407] flex items-center justify-center p-4">
      <div className="bg-[#2A080D] border border-[#D4AF5A]/50 rounded-3xl p-6 sm:p-9 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#D4AF5A] uppercase mb-1">
            ACCESO AL PANEL
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F7EFE4] tracking-tight">
            Cómplices
          </h1>
          <p className="text-xs text-[#A89186] mt-1">
            Ingresa con tus credenciales asignadas
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#E06C75]/15 border border-[#E06C75]/30 text-xs text-[#E06C75] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
              USUARIO
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="superadmin o tu usuario"
              className="w-full bg-[#190407] border border-[#D4AF5A]/30 focus:border-[#D4AF5A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F7EFE4] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[9.5px] font-extrabold tracking-wider text-[#D4AF5A] uppercase block mb-1">
              CONTRASEÑA
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#190407] border border-[#D4AF5A]/30 focus:border-[#D4AF5A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F7EFE4] outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF5A] text-[#190407] py-3 rounded-xl text-xs sm:text-sm font-black hover:bg-[#F3E5AB] disabled:opacity-50 transition-all shadow-md mt-2 active:scale-98"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión ➔'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#D4AF5A]/15 text-center">
          <p className="text-[10px] text-[#A89186]">
            Monitoreo en tiempo real • Espacio privado VIP
          </p>
        </div>
      </div>
    </div>
  )
}

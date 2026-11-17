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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#190407',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        backgroundColor: '#2A080D',
        border: '1.5px solid #D4AF5A',
        borderRadius: 22,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, color: '#D4AF5A', marginBottom: 4 }}>
            ACCESO AL PANEL
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F7EFE4' }}>
            Cómplices
          </h1>
          <p style={{ fontSize: 12, color: '#A89186', marginTop: 4 }}>
            Inicia sesión como Administrador o como Pareja
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(224,108,117,0.15)',
            border: '1px solid rgba(224,108,117,0.35)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#E06C75',
            fontSize: 12,
            marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: '#D4AF5A', marginBottom: 4, display: 'block' }}>
              USUARIO
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="superadmin o tu @usuario"
              style={{
                width: '100%',
                backgroundColor: '#190407',
                border: '1px solid rgba(212,175,90,0.3)',
                borderRadius: 10,
                padding: '11px 14px',
                color: '#F7EFE4',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: '#D4AF5A', marginBottom: 4, display: 'block' }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: '#190407',
                border: '1px solid rgba(212,175,90,0.3)',
                borderRadius: 10,
                padding: '11px 14px',
                color: '#F7EFE4',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#D4AF5A',
              color: '#190407',
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 6,
              boxShadow: '0 4px 15px rgba(212,175,90,0.3)',
            }}
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(212,175,90,0.15)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#A89186', lineHeight: 1.5 }}>
            🛡️ <strong>Acceso Admin:</strong> Administra todas las parejas.<br />
            ♡ <strong>Acceso Pareja:</strong> Solo verás la actividad de tu pareja.
          </p>
        </div>
      </div>
    </div>
  )
}

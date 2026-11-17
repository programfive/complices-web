import { NextResponse } from 'next/server'
import { createSession, ADMIN_USERNAME, ADMIN_PASSWORD } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    const cleanUser = (username || '').trim()
    const cleanPass = (password || '').trim()

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { error: 'Ingresa usuario y contraseña' },
        { status: 400 }
      )
    }

    // 1. Verificar si es Super-Admin
    if (cleanUser === ADMIN_USERNAME && cleanPass === ADMIN_PASSWORD) {
      await createSession({
        isAdmin: true,
        coupleId: null,
        username: 'superadmin',
        coupleName: 'Super Administrador',
      })
      return NextResponse.json({ success: true, isAdmin: true, redirectUrl: '/couples' })
    }

    // 2. Verificar si es una Pareja en Supabase
    const { data: couple, error } = await supabase
      .from('couples')
      .select('*')
      .ilike('username', cleanUser)
      .eq('password', cleanPass)
      .maybeSingle()

    if (error || !couple) {
      return NextResponse.json(
        { error: 'Credenciales inválidas o cuenta no encontrada' },
        { status: 401 }
      )
    }

    // Sesión de Pareja
    await createSession({
      isAdmin: false,
      coupleId: couple.id,
      username: couple.username,
      coupleName: couple.couple_names || `${couple.partner_one} & ${couple.partner_two || 'Pareja'}`,
    })

    return NextResponse.json({
      success: true,
      isAdmin: false,
      redirectUrl: '/notifications',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor' }, { status: 500 })
  }
}

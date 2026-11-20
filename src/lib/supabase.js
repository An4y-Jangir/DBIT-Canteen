import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  rawUrl &&
    rawKey &&
    !rawUrl.includes('your_supabase') &&
    !rawUrl.includes('placeholder')
)

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [Byte Canteen] Supabase environment variables are missing or not set in Vercel. Running in Offline Demo Mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel Project Settings > Environment Variables for live database sync.'
  )
}

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

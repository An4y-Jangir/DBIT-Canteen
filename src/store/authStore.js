import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    // 1. If Supabase is configured, check live session
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile(session.user.id)
          set({ loading: false })
          return
        }
      } catch (err) {
        console.warn('Session check warning:', err)
      }
    }

    // 2. Check for local guest session
    try {
      const savedGuest = localStorage.getItem('byte-canteen-guest')
      if (savedGuest) {
        const parsed = JSON.parse(savedGuest)
        if (parsed?.user) {
          set({ user: parsed.user, profile: parsed.profile ?? null })
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved guest session', e)
    }

    set({ loading: false })

    // 3. Listen to auth changes if Supabase is active
    if (isSupabaseConfigured) {
      try {
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            set({ user: session.user })
            localStorage.removeItem('byte-canteen-guest')
            await get().fetchProfile(session.user.id)
          } else {
            const savedGuest = localStorage.getItem('byte-canteen-guest')
            if (savedGuest) {
              const parsed = JSON.parse(savedGuest)
              set({ user: parsed.user, profile: parsed.profile ?? null })
            } else {
              set({ user: null, profile: null })
            }
          }
        })
      } catch (err) {
        console.warn('Auth state change listener warning:', err)
      }
    }
  },

  fetchProfile: async (userId) => {
    if (!isSupabaseConfigured) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) set({ profile: data })
    } catch (err) {
      console.warn('Fetch profile warning:', err)
    }
  },

  loginAsGuest: async (guestName = 'Campus Guest') => {
    // 1. Try Supabase anonymous sign-in if enabled
    if (isSupabaseConfigured) {
      try {
        if (supabase?.auth?.signInAnonymously) {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (!error && data?.user) {
            const guestProfile = {
              id: data.user.id,
              email: 'guest@dbit.canteen',
              full_name: guestName,
              role: 'student',
              campus_wallet_balance: 500.0,
            }
            set({ user: data.user, profile: guestProfile })
            localStorage.setItem(
              'byte-canteen-guest',
              JSON.stringify({ user: data.user, profile: guestProfile })
            )
            return { success: true, user: data.user }
          }
        }
      } catch (err) {
        console.warn('Supabase anonymous signin unavailable:', err)
      }
    }

    // 2. Instant local guest session fallback (always works immediately)
    const guestId = 'guest-' + Math.random().toString(36).substring(2, 9)
    const guestUser = {
      id: guestId,
      email: 'guest@dbit.canteen',
      isGuest: true,
      user_metadata: { name: guestName },
    }
    const guestProfile = {
      id: guestId,
      email: 'guest@dbit.canteen',
      full_name: guestName,
      role: 'student',
      campus_wallet_balance: 500.0,
    }

    localStorage.setItem(
      'byte-canteen-guest',
      JSON.stringify({ user: guestUser, profile: guestProfile })
    )
    set({ user: guestUser, profile: guestProfile })
    return { success: true, user: guestUser }
  },

  loginAsKitchenStaff: async (staffName = 'Chef Suresh / Canteen Manager') => {
    const kitchenId = 'staff-kitchen-01'
    const kitchenUser = {
      id: kitchenId,
      email: 'kitchen@dbit.in',
      isStaff: true,
      user_metadata: { name: staffName },
    }
    const kitchenProfile = {
      id: kitchenId,
      email: 'kitchen@dbit.in',
      full_name: staffName,
      role: 'kitchen_staff',
      campus_wallet_balance: 9999.0,
    }

    localStorage.setItem(
      'byte-canteen-guest',
      JSON.stringify({ user: kitchenUser, profile: kitchenProfile })
    )
    set({ user: kitchenUser, profile: kitchenProfile })
    return { success: true, user: kitchenUser }
  },

  signOut: async () => {
    localStorage.removeItem('byte-canteen-guest')
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.warn('Sign out warning:', err)
      }
    }
    set({ user: null, profile: null })
  },

  isKitchenStaff: () => {
    const { profile } = get()
    return profile?.role === 'kitchen_staff' || profile?.role === 'admin'
  },
}))

import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
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

    // Check for local guest session
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
  },

  fetchProfile: async (userId) => {
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

  signOut: async () => {
    localStorage.removeItem('byte-canteen-guest')
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out warning:', err)
    }
    set({ user: null, profile: null })
  },

  isKitchenStaff: () => {
    const { profile } = get()
    return profile?.role === 'kitchen_staff' || profile?.role === 'admin'
  },
}))

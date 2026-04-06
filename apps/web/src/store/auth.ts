import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@bench-live/shared'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error?.message ?? 'Login failed')
        set({ user: json.data.user, token: json.data.token })
      },

      logout: () => set({ user: null, token: null }),
    }),
    { name: 'bench-live-auth' }
  )
)

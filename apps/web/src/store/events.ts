import { create } from 'zustand'
import type { Event } from '@bench-live/shared'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface EventsState {
  events: Event[]
  loading: boolean
  fetchEvents: (token: string) => Promise<void>
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  loading: false,

  fetchEvents: async (token) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API}/api/events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) set({ events: json.data })
    } finally {
      set({ loading: false })
    }
  },
}))

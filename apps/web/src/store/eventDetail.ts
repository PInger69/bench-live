import { create } from 'zustand'
import type { Event, Tag } from '@bench-live/shared'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface EventDetailState {
  event: Event | null
  tags: Tag[]
  loading: boolean
  fetchEvent: (id: string, token: string) => Promise<void>
  fetchTags: (eventId: string, token: string) => Promise<void>
  addTag: (tag: Tag) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  clearAllTags: (token: string) => Promise<void>
}

export const useEventDetailStore = create<EventDetailState>((set) => ({
  event: null,
  tags: [],
  loading: false,

  fetchEvent: async (id, token) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) set({ event: json.data })
    } finally {
      set({ loading: false })
    }
  },

  fetchTags: async (eventId, token) => {
    const res = await fetch(`${API}/api/tags?eventId=${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) set({ tags: json.data })
  },

  addTag: (tag) => set((s) => ({ tags: [...s.tags, tag].sort((a, b) => a.time - b.time) })),
  updateTag: (id, updates) =>
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  clearAllTags: async (token) => {
    const { tags } = useEventDetailStore.getState()
    await Promise.all(
      tags.map((t) =>
        fetch(`${API}/api/tags/${t.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      )
    )
    set({ tags: [] })
  },
}))

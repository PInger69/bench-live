'use client'

import { useState } from 'react'
import type { Event, Tag } from '@bench-live/shared'
import { TagType } from '@bench-live/shared'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { apiFetch } from '@/lib/utils'

const DEFAULT_TAG_NAMES = [
  'GOAL', 'SHOT', 'SAVE', 'TACKLE', 'FOUL', 'CORNER', 'FREE KICK',
  'OFFSIDE', 'YELLOW CARD', 'RED CARD', 'SUBSTITUTION', 'KEY PASS',
]

const TAG_COLOURS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

interface TaggerPanelProps {
  event: Event
  token: string
}

export function TaggerPanel({ event, token }: TaggerPanelProps) {
  const { user } = useAuthStore()
  const addTag = useEventDetailStore((s) => s.addTag)
  const [activeColour, setActiveColour] = useState(user?.colour ?? TAG_COLOURS[0])
  const [tagging, setTagging] = useState<string | null>(null)

  async function handleTag(name: string) {
    if (!user) return
    setTagging(name)
    try {
      const tag = await apiFetch<Tag>('/api/tags', token, {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          type: TagType.NORMAL,
          name,
          time: 0, // TODO: wire to video player current time
          duration: 30,
          colour: activeColour,
        }),
      })
      addTag(tag)
    } catch (err) {
      console.error('Failed to create tag:', err)
    } finally {
      setTagging(null)
    }
  }

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      {/* Colour picker */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 font-medium">Colour:</span>
        {TAG_COLOURS.map((c) => (
          <button
            key={c}
            onClick={() => setActiveColour(c)}
            className="h-6 w-6 rounded-full ring-2 transition-all"
            style={{
              background: c,
              ringColor: c === activeColour ? c : 'transparent',
              opacity: c === activeColour ? 1 : 0.5,
            }}
          />
        ))}
      </div>

      {/* Tag buttons */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_TAG_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => handleTag(name)}
            disabled={tagging !== null}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: activeColour }}
          >
            {tagging === name ? '...' : name}
          </button>
        ))}
      </div>
    </div>
  )
}

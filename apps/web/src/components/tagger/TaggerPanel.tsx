'use client'

import { useState } from 'react'
import type { Event, Tag } from '@bench-live/shared'
import { TagType } from '@bench-live/shared'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { apiFetch, formatTime, cn } from '@/lib/utils'

// Sport-specific tag sets
const TAG_SETS: Record<string, string[]> = {
  SOCCER: ['GOAL', 'SHOT ON TARGET', 'SHOT OFF TARGET', 'SAVE', 'CORNER', 'FREE KICK', 'OFFSIDE', 'FOUL', 'YELLOW CARD', 'RED CARD', 'SUBSTITUTION', 'KEY PASS', 'TACKLE', 'INTERCEPTION', 'PENALTY'],
  FOOTBALL: ['TOUCHDOWN', 'FIELD GOAL', 'INTERCEPTION', 'SACK', 'FUMBLE', 'PUNT', 'KICKOFF', 'PENALTY', '1ST DOWN', 'RED ZONE', 'KEY PLAY', 'TURNOVER'],
  HOCKEY: ['GOAL', 'SHOT', 'SAVE', 'PENALTY', 'POWER PLAY', 'SHORT HANDED', 'FACE OFF', 'ICING', 'OFFSIDE', 'FIGHT', 'TURNOVER', 'KEY PLAY'],
  RUGBY: ['TRY', 'CONVERSION', 'PENALTY GOAL', 'DROP GOAL', 'TACKLE', 'LINEOUT', 'SCRUM', 'KNOCK ON', 'PENALTY', 'KEY PLAY', 'TURNOVER'],
  BASKETBALL: ['BASKET', '3 POINTER', 'FREE THROW', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL', 'TIMEOUT', 'FAST BREAK', 'KEY PLAY'],
  GENERIC: ['KEY MOMENT', 'HIGHLIGHT', 'REVIEW', 'GOOD', 'BAD', 'TRAINING POINT', 'TACTIC', 'NOTE'],
}

const PERIODS: Record<string, string[]> = {
  SOCCER: ['1st Half', '2nd Half', 'Extra Time 1', 'Extra Time 2', 'Penalties'],
  FOOTBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  HOCKEY: ['P1', 'P2', 'P3', 'OT'],
  RUGBY: ['1st Half', '2nd Half', 'Extra Time'],
  BASKETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  GENERIC: ['Period 1', 'Period 2', 'Period 3'],
}

const TAG_COLOURS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
]

const DEMO_PLAYERS = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11']

interface TaggerPanelProps {
  event: Event
  token: string
  currentTime: number
}

export function TaggerPanel({ event, token, currentTime }: TaggerPanelProps) {
  const { user } = useAuthStore()
  const addTag = useEventDetailStore((s) => s.addTag)

  const sportType = (event.sportType ?? 'GENERIC') as string
  const tagNames = TAG_SETS[sportType] ?? TAG_SETS.GENERIC
  const periods = PERIODS[sportType] ?? PERIODS.GENERIC

  const [activeColour, setActiveColour] = useState(user?.colour ?? TAG_COLOURS[0].value)
  const [activePeriod, setActivePeriod] = useState(periods[0])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [coachPick, setCoachPick] = useState(false)
  const [tagging, setTagging] = useState<string | null>(null)
  const [lastTagged, setLastTagged] = useState<string | null>(null)
  const [showPlayerPicker, setShowPlayerPicker] = useState(false)

  function togglePlayer(p: string) {
    setSelectedPlayers((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  async function handleTag(name: string) {
    if (!user || tagging) return
    setTagging(name)
    try {
      const tag = await apiFetch<Tag>('/api/tags', token, {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          type: TagType.NORMAL,
          name,
          time: currentTime,
          duration: 30,
          colour: activeColour,
          period: activePeriod,
          players: selectedPlayers,
          comment: comment || undefined,
          rating: rating || undefined,
          coachPick,
        }),
      })
      addTag(tag)
      setLastTagged(name)
      setComment('')
      setTimeout(() => setLastTagged(null), 1500)
    } catch (err) {
      console.error('Failed to create tag:', err)
    } finally {
      setTagging(null)
    }
  }

  return (
    <div className="flex flex-col bg-gray-900 border-t border-gray-800">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 border-b border-gray-800">

        {/* Period selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Period:</span>
          <div className="flex gap-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  activePeriod === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Colour picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-medium">Colour:</span>
          <div className="flex gap-1">
            {TAG_COLOURS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => setActiveColour(c.value)}
                className={cn(
                  'h-5 w-5 rounded-full transition-all',
                  activeColour === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'opacity-60 hover:opacity-100'
                )}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="relative">
          <button
            onClick={() => setShowPlayerPicker(!showPlayerPicker)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
              selectedPlayers.length > 0 ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            Players {selectedPlayers.length > 0 && `(${selectedPlayers.length})`}
          </button>
          {showPlayerPicker && (
            <div className="absolute bottom-full mb-1 left-0 z-50 bg-gray-800 rounded-lg shadow-xl ring-1 ring-gray-700 p-2 w-48">
              <div className="flex flex-wrap gap-1">
                {DEMO_PLAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlayer(p)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs transition-colors',
                      selectedPlayers.includes(p) ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button onClick={() => { setSelectedPlayers([]); setShowPlayerPicker(false) }} className="mt-2 text-xs text-gray-500 hover:text-gray-300">Clear</button>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">Rating:</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(rating === s ? 0 : s)}
              className={cn('text-sm transition-colors', s <= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400/50')}
            >
              ★
            </button>
          ))}
        </div>

        {/* Coach pick */}
        <button
          onClick={() => setCoachPick(!coachPick)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors',
            coachPick ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          )}
        >
          ★ Coach Pick
        </button>

        {/* Current time */}
        <div className="ml-auto text-xs text-gray-500 font-mono">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Comment row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
        />
        {lastTagged && (
          <span className="text-xs text-green-400 font-medium animate-pulse">✓ {lastTagged}</span>
        )}
      </div>

      {/* Tag buttons */}
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {tagNames.map((name) => (
          <button
            key={name}
            onClick={() => handleTag(name)}
            disabled={!!tagging}
            className={cn(
              'rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all active:scale-95',
              tagging === name ? 'opacity-50 scale-95' : 'hover:brightness-110',
              tagging && tagging !== name ? 'opacity-40' : ''
            )}
            style={{ background: activeColour }}
          >
            {tagging === name ? '...' : name}
          </button>
        ))}
      </div>
    </div>
  )
}

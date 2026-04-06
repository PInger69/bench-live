'use client'

import { useState } from 'react'
import { cn, formatTime } from '@/lib/utils'

const SPORTS = [
  { key: 'SOCCER',     label: '⚽ Soccer'     },
  { key: 'HOCKEY',     label: '🏒 Hockey'     },
  { key: 'RUGBY',      label: '🏉 Rugby'      },
  { key: 'FOOTBALL',   label: '🏈 Football'   },
  { key: 'BASKETBALL', label: '🏀 Basketball' },
  { key: 'GENERIC',    label: '📋 Generic'    },
]

export const PERIODS: Record<string, string[]> = {
  SOCCER:     ['1H', '2H', 'ET1', 'ET2', 'P'],
  FOOTBALL:   ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  HOCKEY:     ['P1', 'P2', 'P3', 'OT1', 'OT2', 'P'],
  RUGBY:      ['1H', '2H', 'ET1', 'ET2', 'SD'],
  BASKETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  GENERIC:    ['P1', 'P2', 'P3'],
}

export const TAG_SETS: Record<string, string[]> = {
  SOCCER:     ['GOAL', 'SHOT ON', 'SHOT OFF', 'SAVE', 'CORNER', 'FREE KICK', 'OFFSIDE', 'FOUL', 'YELLOW CARD', 'RED CARD', 'SUBSTITUTION', 'KEY PASS', 'TACKLE', 'INTERCEPTION', 'PENALTY'],
  FOOTBALL:   ['TOUCHDOWN', 'FIELD GOAL', 'INTERCEPTION', 'SACK', 'FUMBLE', 'PUNT', 'KICKOFF', 'PENALTY', '1ST DOWN', 'RED ZONE', 'KEY PLAY', 'TURNOVER'],
  HOCKEY:     ['GOAL', 'SHOT', 'SAVE', 'PENALTY', 'POWER PLAY', 'SHORT HANDED', 'FACE OFF', 'ICING', 'OFFSIDE', 'FIGHT', 'TURNOVER', 'KEY PLAY'],
  RUGBY:      ['TRY', 'CONVERSION', 'PENALTY GOAL', 'DROP GOAL', 'TACKLE', 'LINEOUT', 'SCRUM', 'KNOCK ON', 'PENALTY', 'KEY PLAY', 'TURNOVER'],
  BASKETBALL: ['BASKET', '3 POINTER', 'FREE THROW', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL', 'TIMEOUT', 'FAST BREAK', 'KEY PLAY'],
  GENERIC:    ['KEY MOMENT', 'HIGHLIGHT', 'REVIEW', 'GOOD', 'BAD', 'TRAINING POINT', 'TACTIC', 'NOTE'],
}

export const FILTER_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#6B7280',
]

export const DEMO_PLAYERS = [
  '#1','#2','#3','#4','#5','#6','#7','#8','#9','#10','#11',
  '#12','#13','#14','#15','#16','#17','#18','#19','#20',
]

interface ControlsBarProps {
  defaultSport: string
  currentTime: number
  comment: string
  setComment: (v: string) => void
  onSportChange: (sport: string) => void
  onPeriodChange: (period: string) => void
  onPlayersChange: (players: string[]) => void
  onRatingChange: (rating: number) => void
  onCoachPickChange: (v: boolean) => void
  activeColours: string[]
  onColourFilterChange: (colours: string[]) => void
  activeSport: string
  activePeriod: string
  selectedPlayers: string[]
  rating: number
  coachPick: boolean
  lastTagged: string | null
}

export function ControlsBar({
  currentTime, comment, setComment,
  onSportChange, onPeriodChange, onPlayersChange, onRatingChange, onCoachPickChange,
  activeColours, onColourFilterChange,
  activeSport, activePeriod, selectedPlayers, rating, coachPick, lastTagged,
}: ControlsBarProps) {
  const [showPlayers, setShowPlayers] = useState(false)
  const periods = PERIODS[activeSport] ?? PERIODS.GENERIC

  function togglePlayer(p: string) {
    onPlayersChange(
      selectedPlayers.includes(p) ? selectedPlayers.filter((x) => x !== p) : [...selectedPlayers, p]
    )
  }

  function toggleColourFilter(colour: string) {
    if (activeColours.includes(colour)) {
      onColourFilterChange(activeColours.filter((c) => c !== colour))
    } else {
      onColourFilterChange([...activeColours, colour])
    }
  }

  // Shared button base using CSS tokens (no dark: prefix needed)
  const chipCls = 'px-2.5 py-1.5 rounded-lg text-xs font-bold touch-manipulation transition-colors min-w-[36px]'

  return (
    <div
      className="flex-shrink-0 border-t border-theme"
      style={{ background: 'var(--c-surface)' }}
    >
      {/* Row 1 */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 border-b border-theme"
      >
        {/* Sport */}
        <select
          value={activeSport}
          onChange={(e) => onSportChange(e.target.value)}
          className="rounded-lg text-xs px-2 py-1.5 touch-manipulation focus:outline-none focus:ring-1 focus:ring-brand-500 border border-theme"
          style={{ background: 'var(--c-surf2)', color: 'var(--c-text1)' }}
        >
          {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {/* Period */}
        <div className="flex items-center gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(chipCls, activePeriod === p ? 'bg-brand-600 text-white' : '')}
              style={activePeriod !== p ? { background: 'var(--c-surf2)', color: 'var(--c-text2)' } : {}}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Colour filter dots */}
        <div className="flex items-center gap-1">
          {activeColours.length > 0 && (
            <button
              onClick={() => onColourFilterChange([])}
              className="text-xs px-1.5 py-1 rounded touch-manipulation transition-colors"
              style={{ color: 'var(--c-text3)' }}
            >
              All
            </button>
          )}
          {FILTER_PALETTE.map((colour) => {
            const active = activeColours.includes(colour)
            return (
              <button
                key={colour}
                onClick={() => toggleColourFilter(colour)}
                title={active ? 'Remove filter' : 'Filter'}
                className={cn(
                  'h-6 w-6 rounded-full touch-manipulation transition-all duration-150 flex-shrink-0',
                  active ? 'scale-110 opacity-100' : 'opacity-35 hover:opacity-70 active:scale-95'
                )}
                style={{
                  background: colour,
                  outline: active ? `2px solid var(--c-text1)` : undefined,
                  outlineOffset: active ? '2px' : undefined,
                }}
              />
            )
          })}
        </div>

        {/* Players */}
        <div className="relative">
          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation transition-colors"
            style={
              selectedPlayers.length > 0
                ? { background: '#2563EB', color: '#fff' }
                : { background: 'var(--c-surf2)', color: 'var(--c-text2)' }
            }
          >
            Players {selectedPlayers.length > 0 && `(${selectedPlayers.length})`}
          </button>
          {showPlayers && (
            <div
              className="absolute bottom-full mb-2 left-0 z-50 rounded-xl shadow-2xl border border-theme p-3 w-64"
              style={{ background: 'var(--c-surface)' }}
            >
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEMO_PLAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlayer(p)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium touch-manipulation min-w-[40px]"
                    style={
                      selectedPlayers.includes(p)
                        ? { background: '#2563EB', color: '#fff' }
                        : { background: 'var(--c-surf2)', color: 'var(--c-text1)' }
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => onPlayersChange([])}
                  className="text-xs"
                  style={{ color: 'var(--c-text3)' }}
                >
                  Clear
                </button>
                <button onClick={() => setShowPlayers(false)} className="text-xs text-brand-600">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <button
              key={s}
              onClick={() => onRatingChange(rating === s ? 0 : s)}
              className="text-xl touch-manipulation transition-colors"
              style={{ color: s <= rating ? '#facc15' : 'var(--c-surf3)' }}
            >
              ★
            </button>
          ))}
        </div>

        {/* Coach Pick */}
        <button
          onClick={() => onCoachPickChange(!coachPick)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation transition-colors"
          style={
            coachPick
              ? { background: 'rgba(234,179,8,0.2)', color: '#ca8a04', outline: '1px solid rgba(234,179,8,0.4)' }
              : { background: 'var(--c-surf2)', color: 'var(--c-text3)' }
          }
        >
          ★ Pick
        </button>

        {/* Time */}
        <div className="ml-auto flex items-center gap-3">
          {lastTagged && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ {lastTagged}</span>
          )}
          <span className="text-xs font-mono text-theme3">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Row 2: Comment */}
      <div className="px-3 py-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment to the next tag (optional)..."
          className="w-full rounded-xl px-3 py-2 text-sm border border-theme focus:border-brand-500 focus:outline-none touch-manipulation"
          style={{
            background: 'var(--c-surf2)',
            color: 'var(--c-text1)',
          }}
        />
      </div>
    </div>
  )
}

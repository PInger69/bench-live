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
  SOCCER:     ['GOAL', 'SHOT ON TARGET', 'SHOT OFF TARGET', 'SAVE', 'CORNER', 'FREE KICK', 'OFFSIDE', 'FOUL', 'YELLOW CARD', 'RED CARD', 'SUBSTITUTION', 'KEY PASS', 'TACKLE', 'INTERCEPTION', 'PENALTY'],
  FOOTBALL:   ['TOUCHDOWN', 'FIELD GOAL', 'INTERCEPTION', 'SACK', 'FUMBLE', 'PUNT', 'KICKOFF', 'PENALTY', '1ST DOWN', 'RED ZONE', 'KEY PLAY', 'TURNOVER'],
  HOCKEY:     ['GOAL', 'SHOT', 'SAVE', 'PENALTY', 'POWER PLAY', 'SHORT HANDED', 'FACE OFF', 'ICING', 'OFFSIDE', 'FIGHT', 'TURNOVER', 'KEY PLAY'],
  RUGBY:      ['TRY', 'CONVERSION', 'PENALTY GOAL', 'DROP GOAL', 'TACKLE', 'LINEOUT', 'SCRUM', 'KNOCK ON', 'PENALTY', 'KEY PLAY', 'TURNOVER'],
  BASKETBALL: ['BASKET', '3 POINTER', 'FREE THROW', 'REBOUND', 'ASSIST', 'STEAL', 'BLOCK', 'TURNOVER', 'FOUL', 'TIMEOUT', 'FAST BREAK', 'KEY PLAY'],
  GENERIC:    ['KEY MOMENT', 'HIGHLIGHT', 'REVIEW', 'GOOD', 'BAD', 'TRAINING POINT', 'TACTIC', 'NOTE'],
}

export const TAG_COLOURS = [
  { value: '#3B82F6', label: 'Blue'   },
  { value: '#10B981', label: 'Green'  },
  { value: '#F59E0B', label: 'Amber'  },
  { value: '#EF4444', label: 'Red'    },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink'   },
  { value: '#14B8A6', label: 'Teal'   },
  { value: '#F97316', label: 'Orange' },
]

export const DEMO_PLAYERS = [
  '#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10', '#11',
  '#12', '#13', '#14', '#15', '#16', '#17', '#18', '#19', '#20',
]

interface ControlsBarProps {
  defaultSport: string
  currentTime: number
  comment: string
  setComment: (v: string) => void
  onSportChange: (sport: string) => void
  onPeriodChange: (period: string) => void
  onColourChange: (colour: string) => void
  onPlayersChange: (players: string[]) => void
  onRatingChange: (rating: number) => void
  onCoachPickChange: (v: boolean) => void
  activeSport: string
  activePeriod: string
  activeColour: string
  selectedPlayers: string[]
  rating: number
  coachPick: boolean
  lastTagged: string | null
}

export function ControlsBar({
  currentTime, comment, setComment,
  onSportChange, onPeriodChange, onColourChange, onPlayersChange, onRatingChange, onCoachPickChange,
  activeSport, activePeriod, activeColour, selectedPlayers, rating, coachPick, lastTagged,
}: ControlsBarProps) {
  const [showPlayers, setShowPlayers] = useState(false)
  const periods = PERIODS[activeSport] ?? PERIODS.GENERIC

  function togglePlayer(p: string) {
    onPlayersChange(
      selectedPlayers.includes(p) ? selectedPlayers.filter((x) => x !== p) : [...selectedPlayers, p]
    )
  }

  return (
    <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800">
      {/* Row 1: Sport | Period | Colour | Players | Rating | Coach Pick | Time */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 border-b border-gray-800/60">

        {/* Sport */}
        <select
          value={activeSport}
          onChange={(e) => onSportChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2 py-1.5 touch-manipulation focus:outline-none focus:border-brand-500"
        >
          {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {/* Period */}
        <div className="flex items-center gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-bold touch-manipulation transition-colors min-w-[36px]',
                activePeriod === p ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 active:bg-gray-700'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Colour */}
        <div className="flex items-center gap-1">
          {TAG_COLOURS.map((c) => (
            <button
              key={c.value}
              onClick={() => onColourChange(c.value)}
              title={c.label}
              className={cn(
                'h-6 w-6 rounded-full touch-manipulation transition-all',
                activeColour === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110' : 'opacity-50 active:opacity-100'
              )}
              style={{ background: c.value }}
            />
          ))}
        </div>

        {/* Players */}
        <div className="relative">
          <button
            onClick={() => setShowPlayers(!showPlayers)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation transition-colors',
              selectedPlayers.length > 0 ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400'
            )}
          >
            Players {selectedPlayers.length > 0 && `(${selectedPlayers.length})`}
          </button>
          {showPlayers && (
            <div className="absolute bottom-full mb-2 left-0 z-50 bg-gray-800 rounded-xl shadow-2xl ring-1 ring-gray-700 p-3 w-64">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {DEMO_PLAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlayer(p)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium touch-manipulation min-w-[40px]',
                      selectedPlayers.includes(p) ? 'bg-brand-600 text-white' : 'bg-gray-700 text-gray-300'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => onPlayersChange([])} className="text-xs text-gray-500 active:text-white">Clear</button>
                <button onClick={() => setShowPlayers(false)} className="text-xs text-brand-400">Done</button>
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
              className={cn('text-xl touch-manipulation transition-colors', s <= rating ? 'text-yellow-400' : 'text-gray-700')}
            >
              ★
            </button>
          ))}
        </div>

        {/* Coach Pick */}
        <button
          onClick={() => onCoachPickChange(!coachPick)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation transition-colors',
            coachPick ? 'bg-yellow-500/25 text-yellow-400 ring-1 ring-yellow-500/50' : 'bg-gray-800 text-gray-500'
          )}
        >
          ★ Pick
        </button>

        {/* Time + last tagged */}
        <div className="ml-auto flex items-center gap-3">
          {lastTagged && (
            <span className="text-xs text-green-400 font-medium">✓ {lastTagged}</span>
          )}
          <span className="text-xs text-gray-500 font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Row 2: Comment */}
      <div className="px-3 py-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment to the next tag (optional)..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none touch-manipulation"
        />
      </div>
    </div>
  )
}

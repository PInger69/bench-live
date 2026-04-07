'use client'

import { cn, formatTime } from '@/lib/utils'

const SPORTS = [
  { key: 'SOCCER',     label: '⚽ Soccer'     },
  { key: 'HOCKEY',     label: '🏒 Hockey'     },
  { key: 'RUGBY',      label: '🏉 Rugby'      },
  { key: 'FOOTBALL',   label: '🏈 Football'   },
  { key: 'BASKETBALL', label: '🏀 Basketball' },
  { key: 'GENERIC',    label: '📋 Generic'    },
]

/** Ordered period labels per sport */
export const PERIODS: Record<string, string[]> = {
  SOCCER:     ['1H', '2H', 'ET1', 'ET2', 'P'],
  FOOTBALL:   ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  HOCKEY:     ['P1', 'P2', 'P3', 'OT1', 'OT2', 'P'],
  RUGBY:      ['1H', '2H', 'ET1', 'ET2', 'SD'],
  BASKETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  GENERIC:    ['P1', 'P2', 'P3'],
}

/**
 * Standard start times (seconds) for each period.
 * Soccer  : 2 × 45 min halves; ET 2 × 15 min; P = shootout
 * Hockey  : 3 × 20 min periods; OT sessions 5 min each
 * Rugby   : 2 × 40 min halves; ET 2 × 10 min; SD = sudden death
 * Football: 4 × 15 min quarters
 * Basketball: 4 × 10 min quarters (FIBA)
 */
export const PERIOD_TIMES: Record<string, { label: string; start: number; end: number }[]> = {
  SOCCER: [
    { label: '1H',  start: 0,    end: 2700   },
    { label: '2H',  start: 2700, end: 5400   },
    { label: 'ET1', start: 5400, end: 6300   },
    { label: 'ET2', start: 6300, end: 7200   },
    { label: 'P',   start: 7200, end: Infinity },
  ],
  HOCKEY: [
    { label: 'P1',  start: 0,    end: 1200   },
    { label: 'P2',  start: 1200, end: 2400   },
    { label: 'P3',  start: 2400, end: 3600   },
    { label: 'OT1', start: 3600, end: 3900   },
    { label: 'OT2', start: 3900, end: 4200   },
    { label: 'P',   start: 4200, end: Infinity },
  ],
  RUGBY: [
    { label: '1H',  start: 0,    end: 2400   },
    { label: '2H',  start: 2400, end: 4800   },
    { label: 'ET1', start: 4800, end: 5400   },
    { label: 'ET2', start: 5400, end: 6000   },
    { label: 'SD',  start: 6000, end: Infinity },
  ],
  FOOTBALL: [
    { label: 'Q1', start: 0,    end: 900    },
    { label: 'Q2', start: 900,  end: 1800   },
    { label: 'Q3', start: 1800, end: 2700   },
    { label: 'Q4', start: 2700, end: 3600   },
    { label: 'OT', start: 3600, end: Infinity },
  ],
  BASKETBALL: [
    { label: 'Q1', start: 0,    end: 600    },
    { label: 'Q2', start: 600,  end: 1200   },
    { label: 'Q3', start: 1200, end: 1800   },
    { label: 'Q4', start: 1800, end: 2400   },
    { label: 'OT', start: 2400, end: Infinity },
  ],
  GENERIC: [
    { label: 'P1', start: 0,              end: Infinity / 3       },
    { label: 'P2', start: Infinity / 3,   end: (Infinity / 3) * 2 },
    { label: 'P3', start: (Infinity / 3) * 2, end: Infinity       },
  ],
}

/**
 * Returns the period label that contains the given time (seconds).
 * Falls back to the first period if nothing matches.
 */
export function detectPeriod(timeSeconds: number, sport: string): string {
  const defs = PERIOD_TIMES[sport] ?? PERIOD_TIMES.SOCCER
  return (defs.find((p) => timeSeconds >= p.start && timeSeconds < p.end) ?? defs[0]).label
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

interface ControlsBarProps {
  currentTime: number
  onPeriodChange: (period: string) => void
  onRatingChange: (rating: number) => void
  onCoachPickChange: (v: boolean) => void
  activeColours: string[]
  onColourFilterChange: (colours: string[]) => void
  activeSport: string
  activePeriod: string
  rating: number
  coachPick: boolean
  lastTagged: string | null
}

export function ControlsBar({
  currentTime,
  onPeriodChange, onRatingChange, onCoachPickChange,
  activeColours, onColourFilterChange,
  activeSport, activePeriod, rating, coachPick, lastTagged,
}: ControlsBarProps) {
  const periods   = PERIODS[activeSport] ?? PERIODS.GENERIC
  const autoPeriod = detectPeriod(currentTime, activeSport)

  function toggleColourFilter(colour: string) {
    if (activeColours.includes(colour)) {
      onColourFilterChange(activeColours.filter((c) => c !== colour))
    } else {
      onColourFilterChange([...activeColours, colour])
    }
  }

  return (
    <div
      className="flex-shrink-0"
      style={{
        background: 'var(--c-surface)',
        borderTop: '1px solid var(--c-border)',
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-3 py-2.5">

        {/* ── Period pills ── */}
        <div className="flex items-center gap-1">
          {periods.map((p) => {
            const isAuto   = p === autoPeriod
            const isActive = p === activePeriod
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                title={isAuto ? 'Current period (auto-detected)' : undefined}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide touch-manipulation transition-all duration-150 min-w-[36px]"
                style={
                  isActive
                    ? {
                        background: '#2563EB',
                        color: '#fff',
                        boxShadow: '0 0 10px rgba(37,99,235,0.45)',
                      }
                    : isAuto
                    ? {
                        background: 'var(--c-surf3)',
                        color: 'var(--c-text2)',
                        outline: '1px solid var(--c-border2)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--c-text3)',
                      }
                }
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-4 w-px flex-shrink-0" style={{ background: 'var(--c-border2)' }} />

        {/* ── Colour filter dots ── */}
        <div className="flex items-center gap-1.5">
          {activeColours.length > 0 && (
            <button
              onClick={() => onColourFilterChange([])}
              className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md touch-manipulation transition-all"
              style={{
                color: 'var(--c-text2)',
                background: 'var(--c-surf2)',
                border: '1px solid var(--c-border2)',
              }}
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
                title={active ? 'Remove filter' : 'Filter to this colour'}
                className="rounded-full touch-manipulation transition-all duration-150 flex-shrink-0"
                style={{
                  width: active ? 22 : 18,
                  height: active ? 22 : 18,
                  background: colour,
                  boxShadow: active
                    ? `0 0 10px ${colour}90, 0 0 4px ${colour}`
                    : undefined,
                  outline: active ? `2px solid var(--c-text1)` : 'none',
                  outlineOffset: active ? '2px' : '0',
                  opacity: active ? 1 : 0.4,
                }}
              />
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-4 w-px flex-shrink-0" style={{ background: 'var(--c-border2)' }} />

        {/* ── Rating stars ── */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => onRatingChange(rating === s ? 0 : s)}
              className="text-lg touch-manipulation transition-all duration-100"
              style={{
                color: s <= rating ? '#facc15' : 'var(--c-surf3)',
                textShadow: s <= rating ? '0 0 8px rgba(250,204,21,0.6)' : undefined,
                transform: s <= rating ? 'scale(1.1)' : undefined,
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* ── Coach Pick ── */}
        <button
          onClick={() => onCoachPickChange(!coachPick)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide touch-manipulation transition-all duration-150"
          style={
            coachPick
              ? {
                  background: 'rgba(234,179,8,0.15)',
                  color: '#ca8a04',
                  outline: '1px solid rgba(234,179,8,0.45)',
                  boxShadow: '0 0 8px rgba(234,179,8,0.25)',
                }
              : {
                  background: 'var(--c-surf2)',
                  color: 'var(--c-text3)',
                }
          }
        >
          ★ Pick
        </button>

        {/* ── Time + last tagged ── */}
        <div className="flex items-center gap-2">
          {lastTagged && (
            <span
              className="text-xs font-semibold"
              style={{ color: '#22c55e', textShadow: '0 0 8px rgba(34,197,94,0.5)' }}
            >
              ✓ {lastTagged}
            </span>
          )}
          <span
            className="text-xs font-mono tabular-nums"
            style={{ color: 'var(--c-text3)' }}
          >
            {formatTime(currentTime)}
          </span>
        </div>

      </div>
    </div>
  )
}

'use client'

import { cn, formatTime } from '@/lib/utils'

const SPORTS = [
  { key: 'SOCCER',     label: 'Soccer'     },
  { key: 'HOCKEY',     label: 'Hockey'     },
  { key: 'RUGBY',      label: 'Rugby'      },
  { key: 'FOOTBALL',   label: 'Football'   },
  { key: 'BASKETBALL', label: 'Basketball' },
  { key: 'GENERIC',    label: 'Generic'    },
]

export const PERIODS: Record<string, string[]> = {
  SOCCER:     ['1H', '2H', 'ET1', 'ET2', 'P'],
  FOOTBALL:   ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  HOCKEY:     ['P1', 'P2', 'P3', 'OT1', 'OT2', 'P'],
  RUGBY:      ['1H', '2H', 'ET1', 'ET2', 'SD'],
  BASKETBALL: ['Q1', 'Q2', 'Q3', 'Q4', 'OT'],
  GENERIC:    ['P1', 'P2', 'P3'],
}

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
  const periods    = PERIODS[activeSport] ?? PERIODS.GENERIC
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
      className="flex-shrink-0 glass"
      style={{
        borderTop: '0.5px solid var(--c-border)',
        paddingBottom: 'max(8px, var(--safe-bottom))',
      }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-3 py-2">

        {/* ── iOS Segmented Control — periods ── */}
        <div
          className="relative flex items-center p-0.5"
          style={{
            borderRadius: 10,
            background: 'var(--c-surf2)',
          }}
        >
          {periods.map((p) => {
            const isAuto   = p === autoPeriod
            const isActive = p === activePeriod
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className="relative z-10 px-2.5 py-1.5 text-[12px] font-semibold touch-manipulation transition-all duration-200 min-w-[34px]"
                style={{
                  borderRadius: 8,
                  color: isActive ? '#fff' : isAuto ? 'var(--c-text2)' : 'var(--c-text3)',
                  background: isActive ? 'var(--c-tint)' : 'transparent',
                  boxShadow: isActive
                    ? '0 1px 3px rgba(0,0,0,0.2), 0 0 0 0.5px rgba(0,0,0,0.08)'
                    : undefined,
                  letterSpacing: '-0.01em',
                }}
              >
                {p}
                {isAuto && !isActive && (
                  <span
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--c-tint)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* iOS-style separator */}
        <div className="h-5 w-px flex-shrink-0" style={{ background: 'var(--c-border)' }} />

        {/* ── Colour filter ── */}
        <div className="flex items-center gap-1.5">
          {activeColours.length > 0 && (
            <button
              onClick={() => onColourFilterChange([])}
              className="text-[11px] font-semibold px-2 py-1 rounded-full touch-manipulation transition-all"
              style={{
                color: 'var(--c-tint)',
                background: 'color-mix(in srgb, var(--c-tint) 10%, transparent)',
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
                className="rounded-full touch-manipulation transition-all duration-200 flex-shrink-0"
                style={{
                  width: active ? 24 : 18,
                  height: active ? 24 : 18,
                  background: colour,
                  boxShadow: active ? `0 0 0 2px var(--c-bg), 0 0 0 3.5px ${colour}` : undefined,
                  opacity: active ? 1 : 0.35,
                }}
              />
            )
          })}
        </div>

        <div className="h-5 w-px flex-shrink-0" style={{ background: 'var(--c-border)' }} />

        {/* ── Rating ── */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => onRatingChange(rating === s ? 0 : s)}
              className="text-[17px] touch-manipulation transition-all duration-100"
              style={{
                color: s <= rating ? '#FF9F0A' : 'var(--c-surf3)',
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
          className="px-2.5 py-1.5 rounded-full text-[12px] font-semibold touch-manipulation transition-all duration-200"
          style={
            coachPick
              ? {
                  background: 'color-mix(in srgb, #FF9F0A 15%, transparent)',
                  color: '#FF9F0A',
                  boxShadow: '0 0 0 1px rgba(255,159,10,0.35)',
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
            <span className="text-[12px] font-semibold" style={{ color: '#34C759' }}>
              &#10003; {lastTagged}
            </span>
          )}
          <span
            className="text-[12px] font-mono tabular-nums"
            style={{ color: 'var(--c-text3)', letterSpacing: '-0.02em' }}
          >
            {formatTime(currentTime)}
          </span>
        </div>

      </div>
    </div>
  )
}

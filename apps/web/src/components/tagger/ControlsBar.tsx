'use client'

// no useState needed after Players removal
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
 * These define where each period begins on a full-length recording.
 * The last period's end is Infinity (captures any overtime / extra time).
 *
 * Soccer  : 2 × 45 min halves = 5400 s; ET 2 × 15 min; P = shootout
 * Hockey  : 3 × 20 min periods = 3600 s; OT sessions 5 min each
 * Rugby   : 2 × 40 min halves = 4800 s; ET 2 × 10 min; SD = sudden death
 * Football: 4 × 15 min quarters = 3600 s
 * Basketball: 4 × 10 min quarters = 2400 s (FIBA)
 */
export const PERIOD_TIMES: Record<string, { label: string; start: number; end: number }[]> = {
  SOCCER: [
    { label: '1H',  start: 0,    end: 2700   },  // 0 – 45 min
    { label: '2H',  start: 2700, end: 5400   },  // 45 – 90 min
    { label: 'ET1', start: 5400, end: 6300   },  // 90 – 105 min
    { label: 'ET2', start: 6300, end: 7200   },  // 105 – 120 min
    { label: 'P',   start: 7200, end: Infinity }, // shootout
  ],
  HOCKEY: [
    { label: 'P1',  start: 0,    end: 1200   },  // 0 – 20 min
    { label: 'P2',  start: 1200, end: 2400   },  // 20 – 40 min
    { label: 'P3',  start: 2400, end: 3600   },  // 40 – 60 min
    { label: 'OT1', start: 3600, end: 3900   },  // 60 – 65 min
    { label: 'OT2', start: 3900, end: 4200   },  // 65 – 70 min
    { label: 'P',   start: 4200, end: Infinity },
  ],
  RUGBY: [
    { label: '1H',  start: 0,    end: 2400   },  // 0 – 40 min
    { label: '2H',  start: 2400, end: 4800   },  // 40 – 80 min
    { label: 'ET1', start: 4800, end: 5400   },  // 80 – 90 min
    { label: 'ET2', start: 5400, end: 6000   },  // 90 – 100 min
    { label: 'SD',  start: 6000, end: Infinity }, // sudden death
  ],
  FOOTBALL: [
    { label: 'Q1', start: 0,    end: 900    },   // 0 – 15 min
    { label: 'Q2', start: 900,  end: 1800   },   // 15 – 30 min
    { label: 'Q3', start: 1800, end: 2700   },   // 30 – 45 min
    { label: 'Q4', start: 2700, end: 3600   },   // 45 – 60 min
    { label: 'OT', start: 3600, end: Infinity },
  ],
  BASKETBALL: [
    { label: 'Q1', start: 0,    end: 600    },   // 0 – 10 min
    { label: 'Q2', start: 600,  end: 1200   },   // 10 – 20 min
    { label: 'Q3', start: 1200, end: 1800   },   // 20 – 30 min
    { label: 'Q4', start: 1800, end: 2400   },   // 30 – 40 min
    { label: 'OT', start: 2400, end: Infinity },
  ],
  GENERIC: [
    { label: 'P1', start: 0,              end: Infinity / 3     },
    { label: 'P2', start: Infinity / 3,   end: (Infinity / 3) * 2 },
    { label: 'P3', start: (Infinity / 3) * 2, end: Infinity     },
  ],
}

/**
 * Returns the period label that contains the given time (seconds)
 * for the given sport. Falls back to the first period if nothing matches.
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
  defaultSport: string
  currentTime: number
  comment: string
  setComment: (v: string) => void
  onSportChange: (sport: string) => void
  /**
   * Called when user manually taps a period button.
   * Under normal playback this is driven automatically by detectPeriod().
   */
  onPeriodChange: (period: string) => void
  onRatingChange: (rating: number) => void
  onCoachPickChange: (v: boolean) => void
  activeColours: string[]
  onColourFilterChange: (colours: string[]) => void
  activeSport: string
  /** The currently active period — normally auto-detected, may be user-overridden */
  activePeriod: string
  rating: number
  coachPick: boolean
  lastTagged: string | null
}

export function ControlsBar({
  currentTime, comment, setComment,
  onSportChange, onPeriodChange, onRatingChange, onCoachPickChange,
  activeColours, onColourFilterChange,
  activeSport, activePeriod, rating, coachPick, lastTagged,
}: ControlsBarProps) {
  const periods = PERIODS[activeSport] ?? PERIODS.GENERIC
  // Auto-detected period from the current video time
  const autoPeriod = detectPeriod(currentTime, activeSport)

  function toggleColourFilter(colour: string) {
    if (activeColours.includes(colour)) {
      onColourFilterChange(activeColours.filter((c) => c !== colour))
    } else {
      onColourFilterChange([...activeColours, colour])
    }
  }

  const chipCls = 'px-2.5 py-1.5 rounded-lg text-xs font-bold touch-manipulation transition-colors min-w-[36px]'

  return (
    <div
      className="flex-shrink-0 border-t border-theme"
      style={{ background: 'var(--c-surface)' }}
    >
      {/* Row 1 — centred, wraps naturally on small screens */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-3 py-2 border-b border-theme">

        {/* Sport */}
        <select
          value={activeSport}
          onChange={(e) => onSportChange(e.target.value)}
          className="rounded-lg text-xs px-2 py-1.5 touch-manipulation focus:outline-none focus:ring-1 focus:ring-brand-500 border border-theme"
          style={{ background: 'var(--c-surf2)', color: 'var(--c-text1)' }}
        >
          {SPORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {/* Period — auto-highlighted from video time; tap to force-override */}
        <div className="flex items-center gap-1">
          {periods.map((p) => {
            const isAuto   = p === autoPeriod   // where the clock says we are
            const isActive = p === activePeriod  // may be user-overridden
            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                title={isAuto ? `Current period (auto-detected)` : undefined}
                className={cn(chipCls)}
                style={
                  isActive
                    ? { background: '#2563EB', color: '#fff' }               // selected
                    : isAuto
                    ? { background: 'var(--c-surf3)', color: 'var(--c-text1)' } // auto (dimmer)
                    : { background: 'var(--c-surf2)', color: 'var(--c-text3)' } // inactive
                }
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Colour filter dots */}
        <div className="flex items-center gap-1.5">
          {activeColours.length > 0 && (
            <button
              onClick={() => onColourFilterChange([])}
              className="text-xs px-1.5 py-1 rounded touch-manipulation transition-colors font-medium"
              style={{ color: 'var(--c-text2)', background: 'var(--c-surf2)' }}
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

        {/* Time + last tagged */}
        <div className="flex items-center gap-2">
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

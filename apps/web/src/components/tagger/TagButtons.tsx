'use client'

import { cn } from '@/lib/utils'

interface TagButtonsProps {
  names: string[]
  side: 'left' | 'right'
  getColour: (name: string) => string
  getName?: (name: string) => string
  disabled: boolean
  tagging: string | null
  lastTagged: string | null
  onTag: (name: string) => void
}

/** Haptic-like vibration (5ms) — works on Android Chrome, silent no-op elsewhere */
function haptic() {
  try { navigator?.vibrate?.(5) } catch {}
}

export function TagButtons({ names, side, getColour, getName, disabled, tagging, lastTagged, onTag }: TagButtonsProps) {
  return (
    <div
      className="flex flex-col py-2 px-2 overflow-y-auto"
      style={{
        width: 156, minWidth: 136, maxWidth: 176,
        background: 'var(--c-bg)',
        paddingBottom: 'max(8px, var(--safe-bottom))',
      }}
    >
      {/* iOS Liquid Glass grouped card */}
      <div
        className="glass-elevated relative"
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '0.5px solid var(--glass-border)',
        }}
      >
        {names.map((name, i) => {
          const colour    = getColour(name)
          const label     = getName ? getName(name) : name
          const isTagging = tagging === name
          const wasTagged = lastTagged === label
          const isLast    = i === names.length - 1

          return (
            <TagButton
              key={name}
              name={name}
              label={label}
              colour={colour}
              side={side}
              isTagging={isTagging}
              wasTagged={wasTagged}
              disabled={disabled}
              showSeparator={!isLast}
              onTag={(n) => { haptic(); onTag(n) }}
            />
          )
        })}
      </div>
    </div>
  )
}

function TagButton({ name, label, colour, side, isTagging, wasTagged, disabled, showSeparator, onTag }: {
  name: string
  label: string
  colour: string
  side: 'left' | 'right'
  isTagging: boolean
  wasTagged: boolean
  disabled: boolean
  showSeparator: boolean
  onTag: (name: string) => void
}) {
  return (
    <button
      onPointerDown={() => !disabled && onTag(name)}
      disabled={disabled}
      className={cn(
        'group relative w-full',
        'min-h-[48px] px-3 py-3',
        'touch-manipulation select-none',
        'transition-all duration-150',
        isTagging && 'scale-[0.97] opacity-80',
        wasTagged && 'ios-spring',
        disabled && !isTagging && 'opacity-35 cursor-default',
        !disabled && 'active:bg-[rgba(0,0,0,0.04)] dark:active:bg-[rgba(255,255,255,0.06)]',
      )}
      style={{
        background: wasTagged
          ? 'color-mix(in srgb, #34C759 12%, var(--c-surface))'
          : undefined,
      }}
    >
      {/* Coloured indicator dot — leading edge */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: colour,
          left:  side === 'left'  ? 10 : undefined,
          right: side === 'right' ? 10 : undefined,
          boxShadow: wasTagged ? `0 0 6px ${colour}80` : undefined,
        }}
      />

      {/* Tagged flash overlay */}
      {wasTagged && (
        <div
          className="absolute inset-0 pointer-events-none tagged-flash"
          style={{ background: '#34C759' }}
        />
      )}

      {/* Label */}
      <span
        className={cn(
          'relative block text-[13px] font-semibold leading-tight',
          side === 'left'  ? 'text-right pr-0 pl-5' : 'text-left pl-0 pr-5',
        )}
        style={{
          color: wasTagged ? '#34C759' : 'var(--c-text1)',
          letterSpacing: '-0.01em',
        }}
      >
        {isTagging ? (
          <span className={cn('inline-flex gap-1 items-center', side === 'left' ? 'justify-end' : 'justify-start')}>
            <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: colour, animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: colour, animationDelay: '120ms' }} />
            <span className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: colour, animationDelay: '240ms' }} />
          </span>
        ) : wasTagged ? (
          <>&#10003; {label}</>
        ) : (
          label
        )}
      </span>

      {/* iOS separator line */}
      {showSeparator && (
        <div
          className="absolute bottom-0 h-px"
          style={{
            background: 'var(--c-border)',
            left:  side === 'left'  ? 0  : 16,
            right: side === 'right' ? 0  : 16,
          }}
        />
      )}
    </button>
  )
}

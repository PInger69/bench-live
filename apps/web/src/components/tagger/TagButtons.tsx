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

export function TagButtons({ names, side, getColour, getName, disabled, tagging, lastTagged, onTag }: TagButtonsProps) {
  return (
    <div
      className="flex flex-col gap-1 py-2 px-1.5 overflow-y-auto"
      style={{
        width: 148, minWidth: 130, maxWidth: 168,
        background: 'var(--c-bg)',
        borderLeft:  side === 'right' ? '1px solid var(--c-border)' : undefined,
        borderRight: side === 'left'  ? '1px solid var(--c-border)' : undefined,
      }}
    >
      {names.map((name) => {
        const colour    = getColour(name)
        const label     = getName ? getName(name) : name
        const isTagging = tagging === name
        const wasTagged = lastTagged === label

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
            onTag={onTag}
          />
        )
      })}
    </div>
  )
}

function TagButton({ name, label, colour, side, isTagging, wasTagged, disabled, onTag }: {
  name: string
  label: string
  colour: string
  side: 'left' | 'right'
  isTagging: boolean
  wasTagged: boolean
  disabled: boolean
  onTag: (name: string) => void
}) {
  return (
    <button
      onPointerDown={() => !disabled && onTag(name)}
      disabled={disabled}
      className={cn(
        'group relative w-full overflow-hidden',
        'min-h-[46px] px-3 py-2.5',
        'touch-manipulation select-none',
        'transition-all duration-100',
        side === 'left'  ? 'rounded-r-xl rounded-l-sm' : 'rounded-l-xl rounded-r-sm',
        isTagging && 'scale-95',
        disabled && !isTagging && 'opacity-35 cursor-default',
        !disabled && 'active:scale-95',
      )}
      style={{
        background: wasTagged
          ? 'color-mix(in srgb, #22c55e 16%, var(--c-surf2))'
          : 'var(--c-surf2)',
        borderLeft:  side === 'left'  ? `2px solid ${colour}` : undefined,
        borderRight: side === 'right' ? `2px solid ${colour}` : undefined,
        boxShadow: isTagging
          ? `inset 0 0 16px ${colour}25, 0 0 10px ${colour}15`
          : wasTagged
          ? '0 0 10px rgba(34,197,94,0.25)'
          : 'none',
      }}
    >
      {/* Edge glow gradient — visible on hover */}
      <div
        className="absolute inset-y-0 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          left:  side === 'left'  ? 0      : undefined,
          right: side === 'right' ? 0      : undefined,
          background: side === 'left'
            ? `linear-gradient(to right, ${colour}22, transparent)`
            : `linear-gradient(to left, ${colour}22, transparent)`,
        }}
      />

      {/* Tagged flash */}
      {wasTagged && (
        <div
          className="absolute inset-0 pointer-events-none tagged-flash"
          style={{ background: '#22c55e' }}
        />
      )}

      {/* Label */}
      <span
        className={cn(
          'relative block text-xs font-bold leading-tight tracking-wide',
          side === 'left' ? 'text-right' : 'text-left',
        )}
        style={{
          color: wasTagged ? '#22c55e' : colour,
          textShadow: wasTagged
            ? '0 0 10px rgba(34,197,94,0.5)'
            : `0 0 14px ${colour}55`,
        }}
      >
        {isTagging ? (
          <span
            className={cn(
              'inline-flex gap-1 items-center',
              side === 'left' ? 'justify-end' : 'justify-start',
            )}
          >
            <span className="h-1 w-1 rounded-full animate-bounce" style={{ background: colour, animationDelay: '0ms' }} />
            <span className="h-1 w-1 rounded-full animate-bounce" style={{ background: colour, animationDelay: '120ms' }} />
            <span className="h-1 w-1 rounded-full animate-bounce" style={{ background: colour, animationDelay: '240ms' }} />
          </span>
        ) : wasTagged ? (
          <>✓ {label}</>
        ) : (
          label
        )}
      </span>
    </button>
  )
}

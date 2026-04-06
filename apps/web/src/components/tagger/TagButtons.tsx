'use client'

import { cn } from '@/lib/utils'

interface TagButtonsProps {
  names: string[]
  side: 'left' | 'right'
  getColour: (name: string) => string
  /** Optional: returns a custom display label for a tag key */
  getName?: (name: string) => string
  disabled: boolean
  tagging: string | null
  lastTagged: string | null
  onTag: (name: string) => void
}

export function TagButtons({ names, side, getColour, getName, disabled, tagging, lastTagged, onTag }: TagButtonsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 py-2 px-2 overflow-y-auto',
        'bg-gray-950/80',
        side === 'left' ? 'border-r border-gray-800/80' : 'border-l border-gray-800/80'
      )}
      style={{ width: '158px', minWidth: '140px', maxWidth: '180px' }}
    >
      {names.map((name) => {
        const colour = getColour(name)
        const isTagging = tagging === name
        const wasTagged = lastTagged === name

        return (
          <TagButton
            key={name}
            name={name}
            label={getName ? getName(name) : name}
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
        // Base
        'relative w-full overflow-hidden group',
        'min-h-[50px] px-3 py-2.5',
        'touch-manipulation select-none',
        'transition-all duration-100',
        // Shape — square on the colour-bar side, rounded on outer
        side === 'left'
          ? 'rounded-l-sm rounded-r-xl'
          : 'rounded-r-sm rounded-l-xl',
        // States
        isTagging && 'scale-95 opacity-70',
        wasTagged && 'scale-97',
        disabled && !isTagging && 'opacity-50 cursor-default',
        !disabled && 'active:scale-95',
      )}
      style={{
        background: wasTagged
          ? `${colour}30`
          : `color-mix(in srgb, ${colour} 12%, #111827)`,
        borderLeft: side === 'left' ? `3px solid ${colour}` : undefined,
        borderRight: side === 'right' ? `3px solid ${colour}` : undefined,
        boxShadow: wasTagged ? `inset 0 0 0 1px ${colour}60` : 'none',
      }}
    >
      {/* Flash overlay on tag */}
      {wasTagged && (
        <div
          className="absolute inset-0 opacity-20 animate-ping rounded-inherit"
          style={{ background: colour }}
        />
      )}

      {/* Text */}
      <span
        className={cn(
          'relative block text-xs font-bold leading-tight tracking-wide',
          side === 'left' ? 'text-right' : 'text-left',
          wasTagged ? 'text-white' : 'text-gray-200',
        )}
        style={{ textShadow: wasTagged ? `0 0 8px ${colour}` : undefined }}
      >
        {isTagging ? (
          <span className="inline-flex gap-0.5 items-center">
            <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1 w-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : label}
      </span>

      {/* Colour indicator dot */}
      <span
        className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full opacity-70"
        style={{
          background: colour,
          display: side === 'left' ? 'none' : 'block',
          left: side === 'left' ? '6px' : undefined,
          right: side === 'right' ? '6px' : undefined,
        }}
      />
    </button>
  )
}

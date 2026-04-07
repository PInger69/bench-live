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
      className="flex flex-col gap-1.5 py-2 px-2 overflow-y-auto"
      style={{
        width: 158, minWidth: 140, maxWidth: 180,
        background: 'var(--c-bg)',
        borderLeft:  side === 'right' ? '1px solid var(--c-border)' : undefined,
        borderRight: side === 'left'  ? '1px solid var(--c-border)' : undefined,
      }}
    >
      {names.map((name) => {
        const colour    = getColour(name)
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
        'relative w-full overflow-hidden',
        'min-h-[50px] px-3 py-2.5',
        'touch-manipulation select-none',
        'transition-all duration-100',
        side === 'left'  ? 'rounded-l-sm rounded-r-xl' : 'rounded-r-sm rounded-l-xl',
        isTagging && 'scale-95 opacity-70',
        disabled && !isTagging && 'opacity-50 cursor-default',
        !disabled && 'active:scale-95',
      )}
      style={{
        background: wasTagged
          ? `color-mix(in srgb, ${colour} var(--tag-active-pct), var(--tag-btn-base))`
          : `color-mix(in srgb, ${colour} var(--tag-btn-pct), var(--tag-btn-base))`,
        borderLeft:  side === 'left'  ? `3px solid ${colour}` : undefined,
        borderRight: side === 'right' ? `3px solid ${colour}` : undefined,
        boxShadow: wasTagged ? `inset 0 0 0 1px ${colour}60` : 'none',
      }}
    >
      {wasTagged && (
        <div className="absolute inset-0 opacity-20 animate-ping" style={{ background: colour }} />
      )}

      <span
        className={cn(
          'relative block text-xs font-bold leading-tight tracking-wide',
          side === 'left' ? 'text-right' : 'text-left',
        )}
        style={{
          color: 'var(--c-text1)',
          textShadow: wasTagged ? `0 0 8px ${colour}80` : undefined,
        }}
      >
        {isTagging ? (
          <span className="inline-flex gap-0.5 items-center">
            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1 w-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        ) : label}
      </span>

      <span
        className="absolute top-1.5 h-1.5 w-1.5 rounded-full opacity-70"
        style={{
          background: colour,
          left:  side === 'left'  ? 6 : undefined,
          right: side === 'right' ? 6 : undefined,
        }}
      />
    </button>
  )
}

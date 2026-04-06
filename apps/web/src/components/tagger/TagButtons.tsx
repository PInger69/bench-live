'use client'

import { cn } from '@/lib/utils'

interface TagButtonsProps {
  names: string[]
  side: 'left' | 'right'
  colour: string
  disabled: boolean
  tagging: string | null
  lastTagged: string | null
  onTag: (name: string) => void
}

export function TagButtons({ names, side, colour, disabled, tagging, lastTagged, onTag }: TagButtonsProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-2 overflow-y-auto bg-gray-950',
        side === 'left' ? 'items-end border-r border-gray-800' : 'items-start border-l border-gray-800'
      )}
      style={{ width: '160px', minWidth: '140px', maxWidth: '180px' }}
    >
      {names.map((name) => {
        const isTagging = tagging === name
        const wasTagged = lastTagged === name

        return (
          <button
            key={name}
            onPointerDown={() => !disabled && onTag(name)}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl font-bold text-white transition-all',
              'min-h-[52px] px-3 py-3 text-sm leading-tight',
              'active:scale-95 touch-manipulation select-none',
              isTagging && 'scale-95 opacity-60',
              wasTagged && 'ring-2 ring-white ring-offset-1 ring-offset-gray-950',
              disabled && !isTagging && 'opacity-40',
              side === 'right' ? 'text-left' : 'text-right'
            )}
            style={{
              background: wasTagged ? '#fff' : colour,
              color: wasTagged ? colour : '#fff',
              boxShadow: `0 2px 8px ${colour}55`,
            }}
          >
            {isTagging ? '...' : name}
          </button>
        )
      })}
    </div>
  )
}

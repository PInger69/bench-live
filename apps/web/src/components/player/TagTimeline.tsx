'use client'

import { useRef, useState } from 'react'
import type { Tag } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'

interface TagTimelineProps {
  tags: Tag[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  /** When non-empty, only ticks whose resolved colour is in this list are shown */
  activeColours?: string[]
  /**
   * Colour resolver — called with tag.name to get the *current* user-assigned
   * colour. Falls back to tag.colour (baked-in at creation time) when undefined.
   */
  getColour?: (name: string) => string | undefined
}

export function TagTimeline({
  tags,
  currentTime,
  duration,
  onSeek,
  activeColours = [],
  getColour,
}: TagTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [hoveredTag, setHoveredTag] = useState<Tag | null>(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  /**
   * Resolve the display colour for a tag:
   *   1. Current user setting for this tag name  (live, from settings drawer)
   *   2. The colour stored in the DB at creation time  (fallback)
   */
  function resolveColour(tag: Tag): string {
    return (getColour ? getColour(tag.name) : undefined) ?? tag.colour
  }

  // Apply colour filter using the *resolved* (live) colour
  const visibleTags = activeColours.length > 0
    ? tags.filter((t) => activeColours.includes(resolveColour(t)))
    : tags

  function handleBarClick(e: React.MouseEvent | React.TouchEvent) {
    if (!barRef.current || duration === 0) return
    const rect = barRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(pct * duration)
  }

  return (
    <div className="px-3 py-2 bg-gray-950 border-t border-gray-800 select-none">
      {/* Time labels */}
      <div className="flex justify-between text-xs text-gray-600 font-mono mb-1 px-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        className="relative h-6 cursor-pointer group"
        onClick={handleBarClick}
        onTouchStart={handleBarClick}
      >
        {/* Track */}
        <div className="absolute inset-y-0 my-auto h-1.5 w-full rounded-full bg-gray-800" />

        {/* Played portion */}
        <div
          className="absolute inset-y-0 my-auto h-1.5 rounded-full bg-gray-500 transition-none"
          style={{ width: `${progress}%` }}
        />

        {/* Tag tick marks — colour resolved live from current settings */}
        {duration > 0 && visibleTags.map((tag) => {
          const pct   = (tag.time / duration) * 100
          const colour = resolveColour(tag)
          return (
            <button
              key={tag.id}
              className="absolute top-0 bottom-0 w-1 -translate-x-0.5 group/tick"
              style={{ left: `${pct}%` }}
              onClick={(e) => { e.stopPropagation(); onSeek(tag.time) }}
              onMouseEnter={() => setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-sm opacity-90 group-hover/tick:opacity-100 group-hover/tick:h-5 transition-all"
                style={{ background: colour }}
              />
            </button>
          )
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 -translate-x-px bg-white shadow-lg shadow-white/20 pointer-events-none"
          style={{ left: `${progress}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow" />
        </div>

        {/* Tooltip — also uses live colour */}
        {hoveredTag && duration > 0 && (
          <div
            className="absolute bottom-full mb-2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg ring-1 ring-gray-700 z-50"
            style={{ left: `${(hoveredTag.time / duration) * 100}%` }}
          >
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: resolveColour(hoveredTag) }} />
              <span className="font-medium">{hoveredTag.name}</span>
              <span className="text-gray-400">{formatTime(hoveredTag.time)}</span>
            </div>
            {hoveredTag.period && <div className="text-gray-400 text-xs">{hoveredTag.period}</div>}
          </div>
        )}
      </div>

      {/* Filter indicator */}
      {activeColours.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1 px-0.5">
          <span className="text-xs text-gray-600">Showing</span>
          {activeColours.map((c) => (
            <span key={c} className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c }} />
          ))}
          <span className="text-xs text-gray-600">
            ({visibleTags.length} of {tags.length})
          </span>
        </div>
      )}
    </div>
  )
}

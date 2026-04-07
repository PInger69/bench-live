'use client'

import { useRef, useState } from 'react'
import type { Tag } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'
import { PERIOD_TIMES } from '@/components/tagger/ControlsBar'

interface TagTimelineProps {
  tags: Tag[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  activeColours?: string[]
  getColour?: (name: string) => string | undefined
  sport?: string
}

// Alternating zone tints — very subtle
const ZONE_TINTS = [
  'rgba(59,130,246,0.055)',
  'rgba(139,92,246,0.055)',
  'rgba(16,185,129,0.055)',
  'rgba(245,158,11,0.055)',
  'rgba(239,68,68,0.055)',
  'rgba(20,184,166,0.055)',
]

export function TagTimeline({
  tags, currentTime, duration, onSeek,
  activeColours = [], getColour, sport,
}: TagTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [hoveredTag, setHoveredTag] = useState<Tag | null>(null)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  function resolveColour(tag: Tag): string {
    return (getColour ? getColour(tag.name) : undefined) ?? tag.colour
  }

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

  // Calculate period zone bands
  const zoneDefs = sport && duration > 0 ? (PERIOD_TIMES[sport] ?? []) : []
  const zones = zoneDefs
    .map((z, i) => {
      const startPct = Math.max(0, Math.min(100, (z.start / duration) * 100))
      const endPct   = Math.max(0, Math.min(100, (Math.min(z.end === Infinity ? duration : z.end, duration) / duration) * 100))
      const width    = endPct - startPct
      return { label: z.label, left: startPct, width, tint: ZONE_TINTS[i % ZONE_TINTS.length] }
    })
    .filter((z) => z.width > 0.5) // only show zones with meaningful width

  return (
    <div
      className="select-none flex-shrink-0"
      style={{
        background: 'var(--c-surface)',
        borderTop: '1px solid var(--c-border)',
      }}
    >
      {/* Time labels row */}
      <div
        className="flex justify-between text-xs font-mono px-3 pt-2 pb-0.5"
        style={{ color: 'var(--c-text3)' }}
      >
        <span>{formatTime(currentTime)}</span>
        {activeColours.length > 0 && (
          <span style={{ color: 'var(--c-text3)' }}>
            {visibleTags.length} / {tags.length}
          </span>
        )}
        <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>

      {/* Track zone */}
      <div
        ref={barRef}
        className="relative mx-3 mb-2 cursor-pointer"
        style={{ height: 48 }}
        onClick={handleBarClick}
        onTouchStart={handleBarClick}
      >
        {/* ── Period zone bands ── */}
        {zones.map((zone) => (
          <div
            key={zone.label}
            className="absolute inset-y-0 pointer-events-none"
            style={{
              left:  `${zone.left}%`,
              width: `${zone.width}%`,
              background: zone.tint,
              borderLeft: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Period label at bottom of zone */}
            <span
              className="absolute bottom-1 left-1 text-[9px] font-bold tracking-widest uppercase pointer-events-none select-none"
              style={{ color: 'var(--c-text3)', opacity: 0.8 }}
            >
              {zone.label}
            </span>
          </div>
        ))}

        {/* ── Track hairline (centre) ── */}
        <div
          className="absolute w-full pointer-events-none"
          style={{
            top: '50%',
            height: 1,
            background: 'var(--c-surf3)',
            transform: 'translateY(-50%)',
          }}
        />

        {/* ── Tick marks — full-height glowing lines ── */}
        {duration > 0 && visibleTags.map((tag) => {
          const pct    = (tag.time / duration) * 100
          const colour = resolveColour(tag)
          const isHovered = hoveredTag?.id === tag.id
          return (
            <button
              key={tag.id}
              className="absolute inset-y-0 -translate-x-px"
              style={{ left: `${pct}%`, width: 10, background: 'transparent', padding: 0 }}
              onClick={(e) => { e.stopPropagation(); onSeek(tag.time) }}
              onMouseEnter={() => setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-100"
                style={{
                  width:     isHovered ? 3 : 2,
                  background: colour,
                  boxShadow:  isHovered
                    ? `0 0 8px 2px ${colour}90, 0 0 2px ${colour}`
                    : `0 0 4px 1px ${colour}60`,
                  borderRadius: 1,
                  opacity: isHovered ? 1 : 0.85,
                }}
              />
            </button>
          )
        })}

        {/* ── Playhead ── */}
        {duration > 0 && (
          <div
            className="absolute inset-y-0 -translate-x-px pointer-events-none z-10"
            style={{ left: `${progress}%` }}
          >
            {/* Vertical rule */}
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: 2,
                background: 'var(--c-text1)',
                boxShadow: '0 0 6px rgba(255,255,255,0.25)',
              }}
            />
            {/* Diamond head */}
            <div
              className="absolute left-1/2 top-1"
              style={{
                width: 8, height: 8,
                background: 'var(--c-text1)',
                borderRadius: 2,
                transform: 'translateX(-50%) rotate(45deg)',
                boxShadow: '0 0 4px rgba(255,255,255,0.3)',
              }}
            />
          </div>
        )}

        {/* ── Tooltip ── */}
        {hoveredTag && duration > 0 && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              bottom: 'calc(100% + 8px)',
              left: `${(hoveredTag.time / duration) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap shadow-xl"
              style={{
                background: 'var(--c-surface)',
                border: `1px solid var(--c-border2)`,
                borderLeft: `3px solid ${resolveColour(hoveredTag)}`,
                color: 'var(--c-text1)',
              }}
            >
              <div className="font-semibold" style={{ color: resolveColour(hoveredTag) }}>
                {hoveredTag.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5" style={{ color: 'var(--c-text3)' }}>
                <span className="font-mono">{formatTime(hoveredTag.time)}</span>
                {hoveredTag.period && (
                  <>
                    <span>·</span>
                    <span>{hoveredTag.period}</span>
                  </>
                )}
              </div>
            </div>
            {/* Arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5"
              style={{
                width: 0, height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid var(--c-border2)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Active colour filter pills */}
      {activeColours.length > 0 && (
        <div
          className="flex items-center gap-1.5 px-3 pb-2"
          style={{ color: 'var(--c-text3)' }}
        >
          <span className="text-[10px] font-medium uppercase tracking-widest">Filtered</span>
          {activeColours.map((c) => (
            <span
              key={c}
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, background: c, boxShadow: `0 0 4px ${c}80` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

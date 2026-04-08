'use client'

import { useRef, useState } from 'react'
import type { Tag } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'
import { PERIOD_TIMES } from '@/components/tagger/ControlsBar'

interface TagTimelineProps {
  tags: Tag[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void        // tap-to-seek (tick clicks, etc.)
  onScrubStart?: (time: number) => void // drag begins
  onScrub?: (time: number) => void      // drag move
  onScrubEnd?: () => void               // drag released
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
  onScrubStart, onScrub, onScrubEnd,
  activeColours = [], getColour, sport,
}: TagTimelineProps) {
  const barRef    = useRef<HTMLDivElement>(null)
  const [hoveredTag,  setHoveredTag]  = useState<Tag | null>(null)
  const [isDragging,  setIsDragging]  = useState(false)
  const [dragTime,    setDragTime]    = useState<number | null>(null)

  // While dragging, the playhead shows dragTime immediately (no waiting for video to seek)
  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime
  const progress    = duration > 0 ? (displayTime / duration) * 100 : 0

  function resolveColour(tag: Tag): string {
    return (getColour ? getColour(tag.name) : undefined) ?? tag.colour
  }

  const visibleTags = activeColours.length > 0
    ? tags.filter((t) => activeColours.includes(resolveColour(t)))
    : tags

  // Convert a clientX position into a video time
  function timeFromClientX(clientX: number): number {
    if (!barRef.current || duration === 0) return currentTime
    const rect = barRef.current.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return pct * duration
  }

  // ── Pointer-based scrubbing ──────────────────────────────────────────────
  // setPointerCapture keeps pointer events firing on this element even when
  // the cursor/finger moves outside the bar — essential for smooth scrubbing.

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (duration === 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = timeFromClientX(e.clientX)
    setIsDragging(true)
    setDragTime(t)
    if (onScrubStart) onScrubStart(t)
    else onSeek(t)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || duration === 0) return
    const t = timeFromClientX(e.clientX)
    setDragTime(t)
    if (onScrub) onScrub(t)
    else onSeek(t)
  }

  function handlePointerUp() {
    setIsDragging(false)
    setDragTime(null)
    onScrubEnd?.()
  }

  // ── Period zone bands ────────────────────────────────────────────────────
  const zoneDefs = sport && duration > 0 ? (PERIOD_TIMES[sport] ?? []) : []
  const zones = zoneDefs
    .map((z, i) => {
      const startPct = Math.max(0, Math.min(100, (z.start / duration) * 100))
      const endPct   = Math.max(0, Math.min(100, (Math.min(z.end === Infinity ? duration : z.end, duration) / duration) * 100))
      const width    = endPct - startPct
      return { label: z.label, left: startPct, width, tint: ZONE_TINTS[i % ZONE_TINTS.length] }
    })
    .filter((z) => z.width > 0.5)

  return (
    <div
      className="select-none flex-shrink-0 glass"
      style={{
        borderTop: '0.5px solid var(--c-border)',
      }}
    >
      {/* Time labels row */}
      <div
        className="flex justify-between text-xs font-mono px-3 pt-2 pb-0.5"
        style={{ color: 'var(--c-text3)' }}
      >
        <span style={isDragging ? { color: 'var(--c-text1)', fontWeight: 600 } : undefined}>
          {formatTime(displayTime)}
        </span>
        {activeColours.length > 0 && (
          <span>{visibleTags.length} / {tags.length}</span>
        )}
        <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
      </div>

      {/* ── Track zone ── */}
      <div
        ref={barRef}
        className="relative mx-3 mb-2"
        style={{
          height: 48,
          cursor: isDragging ? 'grabbing' : 'grab',
          // Prevent text selection while scrubbing
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Period zone bands */}
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
            <span
              className="absolute bottom-1 left-1 text-[9px] font-bold tracking-widest uppercase pointer-events-none select-none"
              style={{ color: 'var(--c-text3)', opacity: 0.8 }}
            >
              {zone.label}
            </span>
          </div>
        ))}

        {/* Track hairline */}
        <div
          className="absolute w-full pointer-events-none"
          style={{
            top: '50%',
            height: 1,
            background: 'var(--c-surf3)',
            transform: 'translateY(-50%)',
          }}
        />

        {/* Tick marks */}
        {duration > 0 && visibleTags.map((tag) => {
          const pct       = (tag.time / duration) * 100
          const colour    = resolveColour(tag)
          const isHovered = !isDragging && hoveredTag?.id === tag.id
          return (
            <div
              key={tag.id}
              className="absolute inset-y-0 -translate-x-px"
              style={{ left: `${pct}%`, width: 10, zIndex: 2 }}
              // Tap a tick = seek exactly to that tag (stopPropagation prevents
              // the bar's pointerdown from firing a second seek)
              onPointerDown={(e) => { e.stopPropagation(); onSeek(tag.time) }}
              onMouseEnter={() => !isDragging && setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 transition-all duration-100"
                style={{
                  width:      isHovered ? 3 : 2,
                  background: colour,
                  boxShadow:  isHovered
                    ? `0 0 8px 2px ${colour}90, 0 0 2px ${colour}`
                    : `0 0 4px 1px ${colour}60`,
                  borderRadius: 1,
                  opacity: isHovered ? 1 : 0.85,
                  cursor: 'pointer',
                }}
              />
            </div>
          )
        })}

        {/* ── Playhead ── */}
        {duration > 0 && (
          <div
            className="absolute inset-y-0 pointer-events-none z-10"
            style={{
              left: `${progress}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Atmospheric outer glow column — wide, very low opacity */}
            <div
              className="absolute inset-y-0"
              style={{
                left: '50%',
                width: 1,
                transform: 'translateX(-50%)',
                boxShadow: isDragging
                  ? '0 0 40px 18px rgba(100,160,255,0.18)'
                  : '0 0 28px 12px rgba(100,160,255,0.10)',
                transition: 'box-shadow 150ms',
              }}
            />

            {/* Needle — gradient from solid at top to ghost at bottom */}
            <div
              className="absolute inset-y-0"
              style={{
                left: '50%',
                width: 1.5,
                transform: 'translateX(-50%)',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.08) 100%)',
                boxShadow: isDragging
                  ? '0 0 4px 1.5px rgba(255,255,255,0.9), 0 0 12px 4px rgba(180,215,255,0.65), 0 0 24px 8px rgba(130,180,255,0.30)'
                  : '0 0 3px 1px rgba(255,255,255,0.75), 0 0 10px 3px rgba(180,215,255,0.40), 0 0 20px 7px rgba(130,180,255,0.18)',
                transition: 'box-shadow 150ms',
              }}
            />

            {/* Sphere handle — SVG for perfect sub-pixel anti-aliasing */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                width:  isDragging ? 20 : 15,
                height: isDragging ? 20 : 15,
                transform: 'translateX(-50%)',
                overflow: 'visible',
                // drop-shadow follows the circle shape exactly — no box-model pixels
                filter: isDragging
                  ? [
                      'drop-shadow(0 0 5px rgba(255,255,255,1))',
                      'drop-shadow(0 0 12px rgba(200,228,255,0.95))',
                      'drop-shadow(0 0 26px rgba(150,200,255,0.65))',
                      'drop-shadow(0 0 48px rgba(100,170,255,0.35))',
                    ].join(' ')
                  : [
                      'drop-shadow(0 0 4px rgba(255,255,255,0.95))',
                      'drop-shadow(0 0 10px rgba(200,228,255,0.75))',
                      'drop-shadow(0 0 20px rgba(150,200,255,0.42))',
                      'drop-shadow(0 0 36px rgba(100,170,255,0.20))',
                    ].join(' '),
                transition: 'filter 150ms, width 120ms, height 120ms',
              }}
            >
              <defs>
                <radialGradient id="ph-fill" cx="37%" cy="33%" r="62%" gradientUnits="objectBoundingBox">
                  <stop offset="0%"   stopColor="#ffffff" />
                  <stop offset="52%"  stopColor="#e6f1ff" />
                  <stop offset="100%" stopColor="#b8d2ff" />
                </radialGradient>
                <filter id="ph-glint">
                  <feGaussianBlur stdDeviation="0.6" />
                </filter>
              </defs>
              {/* Main sphere — perfect vector circle */}
              <circle cx="10" cy="10" r="9" fill="url(#ph-fill)" />
              {/* Specular glint — top-left, SVG-blurred so it's smooth */}
              <circle cx="6.5" cy="6.2" r="2.6" fill="white" opacity="0.72" filter="url(#ph-glint)" />
            </svg>
          </div>
        )}

        {/* Tooltip — hidden while dragging */}
        {hoveredTag && !isDragging && duration > 0 && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              bottom: 'calc(100% + 8px)',
              left: `${(hoveredTag.time / duration) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="glass rounded-xl px-3 py-2 text-xs whitespace-nowrap"
              style={{
                border: '0.5px solid var(--glass-border)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
                color: 'var(--c-text1)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: resolveColour(hoveredTag) }} />
                <span className="font-semibold">{hoveredTag.name}</span>
                <span className="font-mono" style={{ color: 'var(--c-text3)' }}>{formatTime(hoveredTag.time)}</span>
                {hoveredTag.period && (
                  <span style={{ color: 'var(--c-text3)' }}>{hoveredTag.period}</span>
                )}
              </div>
            </div>
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

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Tag } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'

interface ClipViewProps {
  open: boolean
  onClose: () => void
  tags: Tag[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  getColourByName?: (name: string) => string | undefined
}

export function ClipView({
  open, onClose, tags, currentTime, duration, onSeek, getColourByName,
}: ClipViewProps) {
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null)
  const [filterRating, setFilterRating] = useState(0)
  const [filterCoachPick, setFilterCoachPick] = useState(false)
  const [search, setSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const thumbStripRef = useRef<HTMLDivElement>(null)

  // Sort tags chronologically
  const sorted = [...tags].sort((a, b) => a.time - b.time)

  // Filtered clips
  const clips = sorted.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())
        && !(t.comment?.toLowerCase().includes(search.toLowerCase()))) return false
    if (filterPeriod && t.period !== filterPeriod) return false
    if (filterRating > 0 && (t.rating ?? 0) < filterRating) return false
    if (filterCoachPick && !t.coachPick) return false
    return true
  })

  // Unique periods from tags
  const periods = Array.from(new Set(tags.map((t) => t.period).filter(Boolean) as string[]))

  // Auto-select the clip nearest to current playback time on open
  useEffect(() => {
    if (open && clips.length > 0 && !selectedTag) {
      const nearest = clips.reduce((prev, curr) =>
        Math.abs(curr.time - currentTime) < Math.abs(prev.time - currentTime) ? curr : prev
      )
      setSelectedTag(nearest)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!open) { setSelectedTag(null); setSearch(''); setFilterPeriod(null); setFilterRating(0); setFilterCoachPick(false) }
  }, [open])

  // Navigate to prev/next clip
  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedTag || clips.length === 0) return
    const idx = clips.findIndex((c) => c.id === selectedTag.id)
    const next = direction === 'next'
      ? clips[Math.min(idx + 1, clips.length - 1)]
      : clips[Math.max(idx - 1, 0)]
    setSelectedTag(next)
    onSeek(next.time)
  }, [selectedTag, clips, onSeek])

  // Scroll thumbnail strip to keep selected clip visible
  useEffect(() => {
    if (!selectedTag || !thumbStripRef.current) return
    const el = thumbStripRef.current.querySelector(`[data-clip-id="${selectedTag.id}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedTag])

  function resolveColour(tag: Tag): string {
    return (getColourByName ? getColourByName(tag.name) : undefined) ?? tag.colour
  }

  function handleClipClick(tag: Tag) {
    setSelectedTag(tag)
    onSeek(tag.time)
  }

  function clearFilters() {
    setSearch('')
    setFilterPeriod(null)
    setFilterRating(0)
    setFilterCoachPick(false)
  }

  const hasFilters = !!search || !!filterPeriod || filterRating > 0 || filterCoachPick
  const selectedIdx = selectedTag ? clips.findIndex((c) => c.id === selectedTag.id) : -1

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* ── Clip View Panel ── */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col glass"
        style={{
          width: 'min(440px, 92vw)',
          borderLeft: '0.5px solid var(--glass-border)',
          animation: 'clip-slide-in 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-3 relative"
          style={{ borderBottom: '0.5px solid var(--c-border)' }}
        >
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--c-text1)' }}>Clip View</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-text3)' }}>
              {clips.length} clip{clips.length !== 1 ? 's' : ''}
              {hasFilters ? ' (filtered)' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs glass-elevated glass-interactive"
            style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
          >
            ✕
          </button>
        </div>

        {/* ── Clip preview & metadata ── */}
        {selectedTag ? (
          <div className="flex-shrink-0 relative" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
            {/* Mini timeline bar showing where clip sits in the full video */}
            <div
              className="relative mx-4 mt-3 rounded-full overflow-hidden"
              style={{ height: 4, background: 'var(--c-surf2)' }}
            >
              {/* Full duration background */}
              {duration > 0 && (
                <>
                  {/* Clip range highlight */}
                  <div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${(selectedTag.time / duration) * 100}%`,
                      width: `${Math.max(0.5, ((selectedTag.duration || 30) / duration) * 100)}%`,
                      background: resolveColour(selectedTag),
                      boxShadow: `0 0 6px ${resolveColour(selectedTag)}80`,
                    }}
                  />
                  {/* All other clips as tiny dots */}
                  {clips.filter((c) => c.id !== selectedTag.id).map((c) => (
                    <div
                      key={c.id}
                      className="absolute top-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        left: `${(c.time / duration) * 100}%`,
                        width: 3, height: 3,
                        background: 'var(--c-text3)',
                        opacity: 0.4,
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Clip detail card */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Tag name + colour dot */}
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    background: resolveColour(selectedTag),
                    boxShadow: `0 0 8px ${resolveColour(selectedTag)}60`,
                  }}
                />
                <span className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--c-text1)' }}>
                  {selectedTag.name}
                </span>
                {selectedTag.coachPick && (
                  <span className="text-xs" style={{ color: '#FF9F0A' }}>★ Pick</span>
                )}
              </div>

              {/* Time + duration + period */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => onSeek(selectedTag.time)}
                  className="text-xs font-mono font-semibold glass-interactive px-2 py-1 rounded-lg"
                  style={{
                    color: 'var(--c-tint)',
                    background: 'var(--glass-bg-elevated)',
                    border: '0.5px solid var(--glass-border)',
                  }}
                >
                  ▶ {formatTime(selectedTag.time)}
                </button>
                <span className="text-[11px] font-mono" style={{ color: 'var(--c-text3)' }}>
                  {selectedTag.duration || 30}s clip
                </span>
                {selectedTag.period && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
                  >
                    {selectedTag.period}
                  </span>
                )}
              </div>

              {/* Rating */}
              {selectedTag.rating != null && selectedTag.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <svg
                      key={r}
                      width="14" height="14" viewBox="0 0 24 24"
                      fill={r <= (selectedTag.rating ?? 0) ? '#FF9F0A' : 'none'}
                      stroke={r <= (selectedTag.rating ?? 0) ? '#FF9F0A' : 'var(--c-text3)'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              )}

              {/* Players */}
              {selectedTag.players && selectedTag.players.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTag.players.map((p) => (
                    <span
                      key={p}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-lg glass-elevated"
                      style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}

              {/* Comment */}
              {selectedTag.comment && (
                <p className="text-xs italic leading-relaxed" style={{ color: 'var(--c-text2)' }}>
                  &ldquo;{selectedTag.comment}&rdquo;
                </p>
              )}

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => navigate('prev')}
                  disabled={selectedIdx <= 0}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl glass-elevated glass-interactive"
                  style={{
                    border: '0.5px solid var(--glass-border)',
                    color: selectedIdx <= 0 ? 'var(--c-text3)' : 'var(--c-text1)',
                    opacity: selectedIdx <= 0 ? 0.4 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--c-text3)' }}>
                  {selectedIdx + 1} / {clips.length}
                </span>
                <button
                  onClick={() => navigate('next')}
                  disabled={selectedIdx >= clips.length - 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl glass-elevated glass-interactive"
                  style={{
                    border: '0.5px solid var(--glass-border)',
                    color: selectedIdx >= clips.length - 1 ? 'var(--c-text3)' : 'var(--c-text1)',
                    opacity: selectedIdx >= clips.length - 1 ? 0.4 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 px-4 py-6 text-center" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
            <p className="text-xs" style={{ color: 'var(--c-text3)' }}>
              {clips.length > 0 ? 'Select a clip below' : 'No clips yet — tag some moments first'}
            </p>
          </div>
        )}

        {/* ── Filter bar ── */}
        <div className="flex-shrink-0 px-3 py-2 space-y-2" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clips..."
            className="w-full rounded-xl px-3 py-1.5 text-xs glass-elevated focus:outline-none"
            style={{
              color: 'var(--c-text1)',
              border: '0.5px solid var(--glass-border)',
            }}
          />

          {/* Filter pills row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Coach Pick */}
            <button
              onClick={() => setFilterCoachPick(!filterCoachPick)}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium glass-interactive"
              style={{
                background: filterCoachPick ? 'rgba(255,159,10,0.15)' : 'var(--glass-bg-elevated)',
                color: filterCoachPick ? '#FF9F0A' : 'var(--c-text3)',
                border: filterCoachPick ? '0.5px solid rgba(255,159,10,0.35)' : '0.5px solid var(--glass-border)',
              }}
            >
              ★ Pick
            </button>

            {/* Rating filter */}
            {[3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(filterRating === r ? 0 : r)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium glass-interactive"
                style={{
                  background: filterRating === r ? 'color-mix(in srgb, var(--c-tint) 15%, transparent)' : 'var(--glass-bg-elevated)',
                  color: filterRating === r ? 'var(--c-tint)' : 'var(--c-text3)',
                  border: filterRating === r ? `0.5px solid color-mix(in srgb, var(--c-tint) 35%, transparent)` : '0.5px solid var(--glass-border)',
                }}
              >
                {r}★+
              </button>
            ))}

            {/* Period filters */}
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(filterPeriod === p ? null : p)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium glass-interactive"
                style={{
                  background: filterPeriod === p ? 'color-mix(in srgb, var(--c-tint) 15%, transparent)' : 'var(--glass-bg-elevated)',
                  color: filterPeriod === p ? 'var(--c-tint)' : 'var(--c-text3)',
                  border: filterPeriod === p ? `0.5px solid color-mix(in srgb, var(--c-tint) 35%, transparent)` : '0.5px solid var(--glass-border)',
                }}
              >
                {p}
              </button>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-medium px-1.5 glass-interactive"
                style={{ color: 'var(--c-text3)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Clip thumbnail strip (horizontal) ── */}
        <div
          ref={thumbStripRef}
          className="flex-shrink-0 flex items-stretch gap-2 px-3 py-2.5 overflow-x-auto"
          style={{
            borderBottom: '0.5px solid var(--c-border)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {clips.map((tag) => {
            const isSelected = selectedTag?.id === tag.id
            const colour = resolveColour(tag)
            return (
              <button
                key={tag.id}
                data-clip-id={tag.id}
                onClick={() => handleClipClick(tag)}
                className="flex-shrink-0 rounded-xl overflow-hidden glass-interactive relative"
                style={{
                  width: 96, height: 56,
                  background: isSelected
                    ? `color-mix(in srgb, ${colour} 20%, var(--glass-bg-elevated))`
                    : 'var(--glass-bg-elevated)',
                  border: isSelected ? `1.5px solid ${colour}` : '0.5px solid var(--glass-border)',
                  boxShadow: isSelected ? `0 0 12px ${colour}40` : undefined,
                }}
              >
                {/* Colour bar top edge */}
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ height: 2.5, background: colour }}
                />
                {/* Content */}
                <div className="flex flex-col items-center justify-center h-full pt-1">
                  <span
                    className="text-[10px] font-bold truncate max-w-[80px] px-1"
                    style={{ color: isSelected ? 'var(--c-text1)' : 'var(--c-text2)' }}
                  >
                    {tag.name}
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--c-text3)' }}>
                    {formatTime(tag.time)}
                  </span>
                  {tag.coachPick && (
                    <span className="text-[9px]" style={{ color: '#FF9F0A' }}>★</span>
                  )}
                </div>
              </button>
            )
          })}
          {clips.length === 0 && (
            <div className="flex-1 text-center py-3">
              <span className="text-[11px]" style={{ color: 'var(--c-text3)' }}>
                {tags.length > 0 ? 'No clips match filters' : 'No clips tagged yet'}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable clip list ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {clips.map((tag, i) => {
            const isSelected = selectedTag?.id === tag.id
            const colour = resolveColour(tag)
            return (
              <div
                key={tag.id}
                onClick={() => handleClipClick(tag)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                style={{
                  background: isSelected
                    ? `color-mix(in srgb, ${colour} 8%, var(--glass-bg-elevated))`
                    : 'transparent',
                  borderBottom: '0.5px solid var(--c-border)',
                  borderLeft: isSelected ? `3px solid ${colour}` : '3px solid transparent',
                }}
              >
                {/* Colour dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: colour,
                    boxShadow: isSelected ? `0 0 6px ${colour}60` : undefined,
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--c-text1)' }}>
                      {tag.name}
                    </span>
                    {tag.coachPick && <span className="text-[10px]" style={{ color: '#FF9F0A' }}>★</span>}
                    {tag.rating != null && tag.rating > 0 && (
                      <span className="text-[10px]" style={{ color: '#FF9F0A' }}>
                        {'★'.repeat(tag.rating)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tag.period && (
                      <span className="text-[10px] font-medium" style={{ color: 'var(--c-text3)' }}>{tag.period}</span>
                    )}
                    {tag.comment && (
                      <span className="text-[10px] italic truncate max-w-[140px]" style={{ color: 'var(--c-text3)' }}>
                        {tag.comment}
                      </span>
                    )}
                  </div>
                </div>

                {/* Time badge */}
                <span className="text-[11px] font-mono tabular-nums flex-shrink-0" style={{ color: 'var(--c-text3)' }}>
                  {formatTime(tag.time)}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: '0.5px solid var(--c-border)' }}
        >
          <span className="text-[11px] font-mono" style={{ color: 'var(--c-text3)' }}>
            {tags.length} total · {clips.length} shown
          </span>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-4 py-1.5 rounded-xl glass-elevated glass-interactive"
            style={{ color: 'var(--c-tint)', border: '0.5px solid var(--glass-border)' }}
          >
            Done
          </button>
        </div>
      </aside>
    </>
  )
}

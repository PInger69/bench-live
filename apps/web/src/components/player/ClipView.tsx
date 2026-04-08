'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Tag } from '@bench-live/shared'
import type { Feed } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'

interface ClipViewProps {
  open: boolean
  onClose: () => void
  tags: Tag[]
  feed: Feed | null
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  getColourByName?: (name: string) => string | undefined
}

export function ClipView({
  open, onClose, tags, feed, currentTime, duration, onSeek, getColourByName,
}: ClipViewProps) {
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null)
  const [filterRating, setFilterRating] = useState(0)
  const [filterCoachPick, setFilterCoachPick] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const thumbStripRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Video player refs — single video element moves between mini + expanded containers
  const miniVideoRef = useRef<HTMLVideoElement>(null)
  const miniHlsRef = useRef<unknown>(null)
  const miniContainerRef = useRef<HTMLDivElement>(null)
  const expandedContainerRef = useRef<HTMLDivElement>(null)
  const [miniPlaying, setMiniPlaying] = useState(false)
  const [miniTime, setMiniTime] = useState(0)
  const clipEndRef = useRef(0)

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

  const periods = Array.from(new Set(tags.map((t) => t.period).filter(Boolean) as string[]))

  // ── Mini video player init ────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !feed) return
    const video = miniVideoRef.current
    if (!video) return

    const url = feed.hlsUrl ?? feed.mp4Url
    if (!url) return

    const prevHls = miniHlsRef.current as { destroy?: () => void } | null
    prevHls?.destroy?.()
    miniHlsRef.current = null

    async function init() {
      if (url!.includes('.m3u8')) {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true })
          miniHlsRef.current = hls
          hls.loadSource(url!)
          hls.attachMedia(video!)
        } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
          video!.src = url!
        }
      } else {
        video!.src = url!
      }
    }

    init()
    return () => { (miniHlsRef.current as { destroy?: () => void } | null)?.destroy?.() }
  }, [open, feed])

  // Track mini player time + auto-pause at clip end
  useEffect(() => {
    const video = miniVideoRef.current
    if (!video) return
    const onTime = () => {
      setMiniTime(video.currentTime)
      // Auto-pause when reaching clip end boundary
      if (clipEndRef.current > 0 && video.currentTime >= clipEndRef.current) {
        video.pause()
      }
    }
    const onPlay  = () => setMiniPlaying(true)
    const onPause = () => setMiniPlaying(false)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [open])

  // Auto-select nearest clip on open
  useEffect(() => {
    if (open && clips.length > 0 && !selectedTag) {
      const nearest = clips.reduce((prev, curr) =>
        Math.abs(curr.time - currentTime) < Math.abs(prev.time - currentTime) ? curr : prev
      )
      seekMiniTo(nearest)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelectedTag(null); setSearch(''); setFilterPeriod(null)
      setFilterRating(0); setFilterCoachPick(false); setExpanded(false)
      miniVideoRef.current?.pause()
    }
  }, [open])

  // ── Seek mini player to a clip ────────────────────────────────────────────
  function seekMiniTo(tag: Tag) {
    setSelectedTag(tag)
    clipEndRef.current = tag.time + (tag.duration || 30)
    const video = miniVideoRef.current
    if (video) {
      video.currentTime = tag.time
      video.play().catch(() => {})
    }
    // Also sync main player
    onSeek(tag.time)
  }

  function toggleMiniPlay() {
    const v = miniVideoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  }

  // Navigate to prev/next clip
  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedTag || clips.length === 0) return
    const idx = clips.findIndex((c) => c.id === selectedTag.id)
    const next = direction === 'next'
      ? clips[Math.min(idx + 1, clips.length - 1)]
      : clips[Math.max(idx - 1, 0)]
    seekMiniTo(next)
  }, [selectedTag, clips]) // eslint-disable-line react-hooks/exhaustive-deps

  // Move the single <video> element into whichever container is visible
  useEffect(() => {
    const video = miniVideoRef.current
    if (!video) return
    const target = expanded ? expandedContainerRef.current : miniContainerRef.current
    if (target && video.parentElement !== target) {
      target.prepend(video)
    }
  }, [expanded])

  // Auto-scroll thumbnail strip
  useEffect(() => {
    if (!selectedTag || !thumbStripRef.current) return
    const el = thumbStripRef.current.querySelector(`[data-clip-id="${selectedTag.id}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedTag])

  function resolveColour(tag: Tag): string {
    return (getColourByName ? getColourByName(tag.name) : undefined) ?? tag.colour
  }

  function clearFilters() {
    setSearch(''); setFilterPeriod(null); setFilterRating(0); setFilterCoachPick(false)
  }

  const hasFilters = !!search || !!filterPeriod || filterRating > 0 || filterCoachPick
  const selectedIdx = selectedTag ? clips.findIndex((c) => c.id === selectedTag.id) : -1
  const clipDuration = selectedTag ? (selectedTag.duration || 30) : 0
  const clipProgress = selectedTag && clipDuration > 0
    ? Math.min(1, Math.max(0, (miniTime - selectedTag.time) / clipDuration))
    : 0

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

        {/* ── Mini video player ── */}
        <div className="flex-shrink-0 relative" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
          <div
            ref={miniContainerRef}
            className="relative mx-3 mt-3 rounded-xl overflow-hidden cursor-pointer"
            style={{
              aspectRatio: '16/9',
              background: '#000',
              border: selectedTag ? `1px solid ${resolveColour(selectedTag)}40` : '0.5px solid var(--glass-border)',
              boxShadow: selectedTag ? `0 4px 20px ${resolveColour(selectedTag)}20` : undefined,
            }}
            onClick={toggleMiniPlay}
          >
            {/* Video element — lives here when not expanded, moves to expanded container when expanded */}
            <video
              ref={miniVideoRef}
              className="absolute inset-0 w-full h-full object-contain"
              playsInline
              muted={false}
              preload="auto"
            />

            {/* Play/pause overlay */}
            {!miniPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 48, height: 48,
                    background: 'rgba(30,30,35,0.50)',
                    backdropFilter: 'saturate(200%) blur(40px)',
                    WebkitBackdropFilter: 'saturate(200%) blur(40px)',
                    boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Expand button — top right */}
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
              className="absolute top-2 right-2 h-7 w-7 rounded-lg flex items-center justify-center glass-interactive"
              title="Expand"
              style={{
                background: 'rgba(30,30,35,0.55)',
                backdropFilter: 'saturate(200%) blur(20px)',
                WebkitBackdropFilter: 'saturate(200%) blur(20px)',
                border: '0.5px solid rgba(255,255,255,0.12)',
                color: '#fff',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 3 21 3 21 9"/>
                <polyline points="9 21 3 21 3 15"/>
                <line x1="21" y1="3" x2="14" y2="10"/>
                <line x1="3" y1="21" x2="10" y2="14"/>
              </svg>
            </button>

            {/* Clip progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: 3 }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${clipProgress * 100}%`,
                  background: selectedTag ? resolveColour(selectedTag) : 'var(--c-tint)',
                  boxShadow: `0 0 4px ${selectedTag ? resolveColour(selectedTag) : 'var(--c-tint)'}80`,
                }}
              />
            </div>

            {/* Clip time overlay */}
            {selectedTag && (
              <div
                className="absolute bottom-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                }}
              >
                {formatTime(miniTime)} / {formatTime(selectedTag.time + clipDuration)}
              </div>
            )}
          </div>

          {/* Clip detail + nav below video */}
          {selectedTag && (
            <div className="px-4 py-2.5 space-y-2">
              {/* Tag name + colour dot */}
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    background: resolveColour(selectedTag),
                    boxShadow: `0 0 6px ${resolveColour(selectedTag)}60`,
                  }}
                />
                <span className="text-xs font-bold flex-1 truncate" style={{ color: 'var(--c-text1)' }}>
                  {selectedTag.name}
                </span>
                {selectedTag.period && (
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
                  >
                    {selectedTag.period}
                  </span>
                )}
                {selectedTag.coachPick && (
                  <span className="text-[10px]" style={{ color: '#FF9F0A' }}>★</span>
                )}
                {selectedTag.rating != null && selectedTag.rating > 0 && (
                  <span className="text-[10px]" style={{ color: '#FF9F0A' }}>
                    {'★'.repeat(selectedTag.rating)}
                  </span>
                )}
              </div>

              {/* Comment */}
              {selectedTag.comment && (
                <p className="text-[11px] italic truncate" style={{ color: 'var(--c-text3)' }}>
                  &ldquo;{selectedTag.comment}&rdquo;
                </p>
              )}

              {/* Prev / Next */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate('prev')}
                  disabled={selectedIdx <= 0}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg glass-elevated glass-interactive"
                  style={{
                    border: '0.5px solid var(--glass-border)',
                    color: selectedIdx <= 0 ? 'var(--c-text3)' : 'var(--c-text1)',
                    opacity: selectedIdx <= 0 ? 0.4 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--c-text3)' }}>
                  {selectedIdx + 1} / {clips.length}
                </span>
                <button
                  onClick={() => navigate('next')}
                  disabled={selectedIdx >= clips.length - 1}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg glass-elevated glass-interactive"
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
          )}
        </div>

        {/* ── Filter bar ── */}
        <div className="flex-shrink-0 px-3 py-2 space-y-2" style={{ borderBottom: '0.5px solid var(--c-border)' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clips..."
            className="w-full rounded-xl px-3 py-1.5 text-xs glass-elevated focus:outline-none"
            style={{ color: 'var(--c-text1)', border: '0.5px solid var(--glass-border)' }}
          />
          <div className="flex items-center gap-1.5 flex-wrap">
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
            {[3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(filterRating === r ? 0 : r)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium glass-interactive"
                style={{
                  background: filterRating === r ? 'color-mix(in srgb, var(--c-tint) 15%, transparent)' : 'var(--glass-bg-elevated)',
                  color: filterRating === r ? 'var(--c-tint)' : 'var(--c-text3)',
                  border: filterRating === r ? '0.5px solid color-mix(in srgb, var(--c-tint) 35%, transparent)' : '0.5px solid var(--glass-border)',
                }}
              >
                {r}★+
              </button>
            ))}
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriod(filterPeriod === p ? null : p)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium glass-interactive"
                style={{
                  background: filterPeriod === p ? 'color-mix(in srgb, var(--c-tint) 15%, transparent)' : 'var(--glass-bg-elevated)',
                  color: filterPeriod === p ? 'var(--c-tint)' : 'var(--c-text3)',
                  border: filterPeriod === p ? '0.5px solid color-mix(in srgb, var(--c-tint) 35%, transparent)' : '0.5px solid var(--glass-border)',
                }}
              >
                {p}
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearFilters} className="text-[11px] font-medium px-1.5 glass-interactive" style={{ color: 'var(--c-text3)' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Clip thumbnail strip (horizontal) ── */}
        <div
          ref={thumbStripRef}
          className="flex-shrink-0 flex items-stretch gap-2 px-3 py-2 overflow-x-auto"
          style={{ borderBottom: '0.5px solid var(--c-border)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {clips.map((tag) => {
            const isSelected = selectedTag?.id === tag.id
            const colour = resolveColour(tag)
            return (
              <button
                key={tag.id}
                data-clip-id={tag.id}
                onClick={() => seekMiniTo(tag)}
                className="flex-shrink-0 rounded-xl overflow-hidden glass-interactive relative"
                style={{
                  width: 88, height: 50,
                  background: isSelected
                    ? `color-mix(in srgb, ${colour} 20%, var(--glass-bg-elevated))`
                    : 'var(--glass-bg-elevated)',
                  border: isSelected ? `1.5px solid ${colour}` : '0.5px solid var(--glass-border)',
                  boxShadow: isSelected ? `0 0 12px ${colour}40` : undefined,
                }}
              >
                <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: colour }} />
                <div className="flex flex-col items-center justify-center h-full pt-0.5">
                  <span className="text-[9px] font-bold truncate max-w-[74px] px-1" style={{ color: isSelected ? 'var(--c-text1)' : 'var(--c-text2)' }}>
                    {tag.name}
                  </span>
                  <span className="text-[8px] font-mono" style={{ color: 'var(--c-text3)' }}>
                    {formatTime(tag.time)}
                  </span>
                </div>
              </button>
            )
          })}
          {clips.length === 0 && (
            <div className="flex-1 text-center py-2">
              <span className="text-[11px]" style={{ color: 'var(--c-text3)' }}>
                {tags.length > 0 ? 'No clips match filters' : 'No clips tagged yet'}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable clip list ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {clips.map((tag) => {
            const isSelected = selectedTag?.id === tag.id
            const colour = resolveColour(tag)
            return (
              <div
                key={tag.id}
                onClick={() => seekMiniTo(tag)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                style={{
                  background: isSelected ? `color-mix(in srgb, ${colour} 8%, var(--glass-bg-elevated))` : 'transparent',
                  borderBottom: '0.5px solid var(--c-border)',
                  borderLeft: isSelected ? `3px solid ${colour}` : '3px solid transparent',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: colour, boxShadow: isSelected ? `0 0 6px ${colour}60` : undefined }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--c-text1)' }}>{tag.name}</span>
                    {tag.coachPick && <span className="text-[10px]" style={{ color: '#FF9F0A' }}>★</span>}
                    {tag.rating != null && tag.rating > 0 && (
                      <span className="text-[10px]" style={{ color: '#FF9F0A' }}>{'★'.repeat(tag.rating)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tag.period && <span className="text-[10px] font-medium" style={{ color: 'var(--c-text3)' }}>{tag.period}</span>}
                    {tag.comment && (
                      <span className="text-[10px] italic truncate max-w-[140px]" style={{ color: 'var(--c-text3)' }}>{tag.comment}</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-mono tabular-nums flex-shrink-0" style={{ color: 'var(--c-text3)' }}>
                  {formatTime(tag.time)}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5" style={{ borderTop: '0.5px solid var(--c-border)' }}>
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Expanded Player — secondary glass slide-out over the first ──     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {expanded && selectedTag && (
        <div
          className="fixed right-0 top-0 bottom-0 z-[60] flex flex-col glass"
          style={{
            width: 'min(440px, 92vw)',
            borderLeft: '0.5px solid var(--glass-border)',
            animation: 'clip-expand-in 0.24s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Expanded header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '0.5px solid var(--c-border)' }}
          >
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 text-xs font-medium glass-interactive px-2 py-1 rounded-lg"
              style={{ color: 'var(--c-tint)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Clips
            </button>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: resolveColour(selectedTag), boxShadow: `0 0 6px ${resolveColour(selectedTag)}60` }}
              />
              <span className="text-xs font-bold truncate max-w-[180px]" style={{ color: 'var(--c-text1)' }}>
                {selectedTag.name}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs glass-elevated glass-interactive"
              style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
            >
              ✕
            </button>
          </div>

          {/* Full-size video — the <video> element will be moved here by the useEffect */}
          <div
            ref={expandedContainerRef}
            className="flex-1 relative bg-black flex items-center justify-center cursor-pointer"
            onClick={toggleMiniPlay}
          >

            {/* Play overlay */}
            {!miniPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 64, height: 64,
                    background: 'rgba(30,30,35,0.50)',
                    backdropFilter: 'saturate(200%) blur(40px)',
                    WebkitBackdropFilter: 'saturate(200%) blur(40px)',
                    boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 z-10" style={{ height: 4 }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${clipProgress * 100}%`,
                  background: resolveColour(selectedTag),
                  boxShadow: `0 0 6px ${resolveColour(selectedTag)}80`,
                }}
              />
            </div>

            {/* Time overlay */}
            <div
              className="absolute bottom-3 left-3 z-10 text-xs font-mono px-2 py-1 rounded-lg"
              style={{
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
              }}
            >
              {formatTime(miniTime)} / {formatTime(selectedTag.time + clipDuration)}
            </div>
          </div>

          {/* Expanded detail + controls */}
          <div className="flex-shrink-0 px-4 py-3 space-y-2.5" style={{ borderTop: '0.5px solid var(--c-border)' }}>
            {/* Tag info row */}
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: resolveColour(selectedTag), boxShadow: `0 0 8px ${resolveColour(selectedTag)}60` }}
              />
              <span className="text-sm font-bold flex-1 truncate" style={{ color: 'var(--c-text1)' }}>
                {selectedTag.name}
              </span>
              {selectedTag.period && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
                >
                  {selectedTag.period}
                </span>
              )}
              {selectedTag.coachPick && <span className="text-xs" style={{ color: '#FF9F0A' }}>★ Pick</span>}
            </div>

            {/* Rating */}
            {selectedTag.rating != null && selectedTag.rating > 0 && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((r) => (
                  <svg key={r} width="14" height="14" viewBox="0 0 24 24"
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
                  <span key={p} className="text-[11px] font-medium px-2 py-0.5 rounded-lg glass-elevated"
                    style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
                  >{p}</span>
                ))}
              </div>
            )}

            {/* Comment */}
            {selectedTag.comment && (
              <p className="text-xs italic leading-relaxed" style={{ color: 'var(--c-text2)' }}>
                &ldquo;{selectedTag.comment}&rdquo;
              </p>
            )}

            {/* Nav row */}
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
      )}
    </>
  )
}

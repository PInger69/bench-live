'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { TagTimeline } from '@/components/player/TagTimeline'
import { TagButtons } from '@/components/tagger/TagButtons'
import { ControlsBar, PERIODS, TAG_SETS, detectPeriod } from '@/components/tagger/ControlsBar'
import { TagColourSettings } from '@/components/settings/TagColourSettings'
import { useTagColours } from '@/hooks/useTagColours'
import { ThemeToggle } from '@/components/ThemeToggle'
import { apiFetch } from '@/lib/utils'
import type { Tag } from '@bench-live/shared'
import { TagType } from '@bench-live/shared'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { event, tags, loading, fetchEvent, fetchTags, addTag, clearAllTags } = useEventDetailStore()

  const playerRef = useRef<VideoPlayerHandle>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Per-tag colour map + custom names
  const { getColour, setColour, colourMap, getName, setName, nameMap, resetAll } = useTagColours()

  /**
   * Resolve the current colour for a tag given its stored display name.
   *
   * The colour map is keyed by canonical TAG_SETS keys (e.g. "GOAL"), but
   * tag.name in the DB is the display name at creation time (e.g. "GOAL GREAT").
   * We walk all TAG_SETS keys to find which one's display name matches, then
   * look up the colour by canonical key so renaming never breaks colour lookups.
   *
   * Falls back to `undefined` so TagTimeline can use tag.colour from the DB.
   */
  const getColourByName = useCallback((tagName: string): string | undefined => {
    for (const keys of Object.values(TAG_SETS)) {
      for (const key of keys) {
        if (getName(key) === tagName || key === tagName) {
          return getColour(key)
        }
      }
    }
    // Direct lookup as last resort (e.g. tag from another sport)
    return colourMap[tagName]
  }, [getName, getColour, colourMap, nameMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // Timeline colour filter (empty = show all)
  const [activeColours, setActiveColours] = useState<string[]>([])

  // Tagger state
  const [activeSport, setActiveSport] = useState('SOCCER')
  // activePeriod tracks user manual override; null = always auto-detect from time
  const [periodOverride, setPeriodOverride] = useState<string | null>(null)
  const [rating, setRating] = useState(0)
  const [coachPick, setCoachPick] = useState(false)
  const [tagging, setTagging] = useState<string | null>(null)
  const [lastTagged, setLastTagged] = useState<string | null>(null)

  // The active period: user override if set, otherwise auto-detected from video time
  const activePeriod = periodOverride ?? detectPeriod(currentTime, activeSport)

  function handleSportChange(sport: string) {
    setActiveSport(sport)
    setPeriodOverride(null) // clear override when sport changes
  }

  function handlePeriodChange(period: string) {
    // If user taps the already-auto-detected period, clear the override
    // If user taps a different one, set it as override
    const auto = detectPeriod(currentTime, activeSport)
    setPeriodOverride(period === auto ? null : period)
  }

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time)
    // Do NOT clear periodOverride here — the user's manual period
    // selection should persist through seeks and scrubs. It only
    // resets when the user taps the auto-detected period or changes sport.
  }, [])

  const handleScrubStart = useCallback((time: number) => {
    playerRef.current?.beginScrub()
    playerRef.current?.scrub(time)
  }, [])

  const handleScrub = useCallback((time: number) => {
    playerRef.current?.scrub(time)
  }, [])

  const handleScrubEnd = useCallback(() => {
    playerRef.current?.endScrub()
  }, [])

  async function handleTag(tagKey: string) {
    if (!user || tagging || !token) return
    setTagging(tagKey)
    // Use the display name (custom or default key) for the stored tag name
    const displayName = getName(tagKey)
    try {
      const tag = await apiFetch<Tag>('/api/tags', token, {
        method: 'POST',
        body: JSON.stringify({
          eventId: id,
          type: TagType.NORMAL,
          name: displayName,
          time: currentTime,
          duration: 30,
          colour: getColour(tagKey),
          period: activePeriod,
          rating: rating || undefined,
          coachPick,
        }),
      })
      addTag(tag)
      setLastTagged(displayName)
      setTimeout(() => setLastTagged(null), 1800)
    } catch (err) {
      console.error('Failed to create tag:', err)
    } finally {
      setTagging(null)
    }
  }

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchEvent(id, token)
    fetchTags(id, token)
  }, [id, token, fetchEvent, fetchTags, router])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  // ArrowRight / ArrowLeft  → next / prev tick mark
  // Shift + Arrow           → jump ±10 tick marks
  // Skips when focus is inside a text input so typing still works normally.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      e.preventDefault()

      // Build sorted list of visible tick times (respects active colour filter)
      const visibleTags = (activeColours.length > 0
        ? tags.filter((t) => activeColours.includes(getColourByName(t.name) ?? t.colour))
        : tags
      ).slice().sort((a, b) => a.time - b.time)

      if (visibleTags.length === 0) return

      const step   = e.shiftKey ? 10 : 1
      const times  = visibleTags.map((t) => t.time)
      const fwd    = e.key === 'ArrowRight'

      if (fwd) {
        // Find all ticks strictly after current time, take the step-th one
        const ahead = times.filter((t) => t > currentTime + 0.1)
        const target = ahead[step - 1] ?? ahead[ahead.length - 1]
        if (target !== undefined) handleSeek(target)
      } else {
        // Find all ticks strictly before current time, take the step-th from the end
        const behind = times.filter((t) => t < currentTime - 0.1)
        const target = behind[behind.length - step] ?? behind[0]
        if (target !== undefined) handleSeek(target)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tags, currentTime, activeColours, getColourByName, handleSeek])

  useEffect(() => {
    if (event?.sportType) {
      setActiveSport(event.sportType as string)
      setPeriodOverride(null)
    }
  }, [event?.sportType])

  if (loading || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--c-text2)' }}>Loading event...</p>
        </div>
      </main>
    )
  }

  const allTagKeys = TAG_SETS[activeSport] ?? TAG_SETS.GENERIC
  const mid = Math.ceil(allTagKeys.length / 2)
  const leftTags = allTagKeys.slice(0, mid)
  const rightTags = allTagKeys.slice(mid)
  const primaryFeed = event.feeds?.[0] ?? null

  return (
    <main className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--c-bg)' }}>

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 px-3 py-2 flex items-center justify-between gap-2"
        style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/events')}
            className="text-sm flex-shrink-0 touch-manipulation p-1 transition-colors"
            style={{ color: 'var(--c-text2)' }}
          >
            ←
          </button>
          <span className="flex-shrink-0" style={{ color: 'var(--c-text3)' }}>/</span>
          <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--c-text1)' }}>{event.name}</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {event.homeTeam && event.visitTeam && (
            <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--c-text2)' }}>
              {event.homeTeam.shortName}
              <span style={{ color: 'var(--c-text3)' }}> vs </span>
              {event.visitTeam.shortName}
            </span>
          )}

          {event.status === 'LIVE' ? (
            <span
              className="flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 tag-live"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444', outline: '1px solid rgba(220,38,38,0.4)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#ef4444' }} /> LIVE
            </span>
          ) : (
            <span
              className="text-xs rounded-full px-2.5 py-1"
              style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
            >
              {event.status}
            </span>
          )}

          {/* Debug: clear all tags */}
          {tags.length > 0 && (
            <button
              onClick={() => confirm(`Delete all ${tags.length} tags?`) && clearAllTags(token!)}
              className="transition-colors p-1 touch-manipulation hover:text-red-500"
              style={{ color: 'var(--c-text3)' }}
              title="Clear all tags"
            >
              🗑
            </button>
          )}

          {/* ☀/🌙 Theme toggle */}
          <ThemeToggle />

          {/* ⚙ Settings gear */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8 rounded-full flex items-center justify-center transition-colors touch-manipulation"
            style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
            title="Tag Names & Colours"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          {/* User avatar */}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: user?.colour ?? '#6366F1' }}
          >
            {user?.name?.[0] ?? '?'}
          </div>
        </div>
      </header>

      {/* ── Body: Left Tags | Video + Timeline + Controls | Right Tags ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left thumb tag buttons */}
        <TagButtons
          side="left"
          names={leftTags}
          getColour={getColour}
          getName={getName}
          disabled={!!tagging}
          tagging={tagging}
          lastTagged={lastTagged}
          onTag={handleTag}
        />

        {/* Centre column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Video */}
          <div className="flex-1 min-h-0 bg-black flex items-center justify-center">
            <VideoPlayer
              ref={playerRef}
              feed={primaryFeed}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />
          </div>

          {/* Tag timeline — getColourByName bridges display name → canonical key
               → current colour setting, so all ticks update when colour changes */}
          <TagTimeline
            tags={tags}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            onScrubStart={handleScrubStart}
            onScrub={handleScrub}
            onScrubEnd={handleScrubEnd}
            activeColours={activeColours}
            getColour={getColourByName}
            sport={activeSport}
          />

          {/* Controls bar */}
          <ControlsBar
            currentTime={currentTime}
            onPeriodChange={handlePeriodChange}
            onRatingChange={setRating}
            onCoachPickChange={setCoachPick}
            activeColours={activeColours}
            onColourFilterChange={setActiveColours}
            activeSport={activeSport}
            activePeriod={activePeriod}
            rating={rating}
            coachPick={coachPick}
            lastTagged={lastTagged}
          />
        </div>

        {/* Right thumb tag buttons */}
        <TagButtons
          side="right"
          names={rightTags}
          getColour={getColour}
          getName={getName}
          disabled={!!tagging}
          tagging={tagging}
          lastTagged={lastTagged}
          onTag={handleTag}
        />
      </div>

      {/* ── Tag Names & Colours settings drawer ── */}
      <TagColourSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        activeSport={activeSport}
        onSportChange={handleSportChange}
        colourMap={colourMap}
        nameMap={nameMap}
        onSetColour={setColour}
        onSetName={setName}
        onResetAll={resetAll}
      />
    </main>
  )
}

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { TagTimeline } from '@/components/player/TagTimeline'
import { TagButtons } from '@/components/tagger/TagButtons'
import { ControlsBar, PERIODS, TAG_SETS } from '@/components/tagger/ControlsBar'
import { TagColourSettings } from '@/components/settings/TagColourSettings'
import { useTagColours } from '@/hooks/useTagColours'
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

  // Timeline colour filter (empty = show all)
  const [activeColours, setActiveColours] = useState<string[]>([])

  // Tagger state
  const [activeSport, setActiveSport] = useState('SOCCER')
  const [activePeriod, setActivePeriod] = useState('1H')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [coachPick, setCoachPick] = useState(false)
  const [comment, setComment] = useState('')
  const [tagging, setTagging] = useState<string | null>(null)
  const [lastTagged, setLastTagged] = useState<string | null>(null)

  function handleSportChange(sport: string) {
    setActiveSport(sport)
    setActivePeriod(PERIODS[sport]?.[0] ?? '1H')
  }

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time)
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
          players: selectedPlayers,
          comment: comment || undefined,
          rating: rating || undefined,
          coachPick,
        }),
      })
      addTag(tag)
      setLastTagged(displayName)
      setComment('')
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

  useEffect(() => {
    if (event?.sportType) {
      const s = event.sportType as string
      setActiveSport(s)
      setActivePeriod(PERIODS[s]?.[0] ?? '1H')
    }
  }, [event?.sportType])

  if (loading || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading event...</p>
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
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => router.push('/events')} className="text-gray-400 hover:text-white text-sm flex-shrink-0 touch-manipulation p-1">
            ←
          </button>
          <span className="text-gray-700 flex-shrink-0">/</span>
          <h1 className="text-sm font-semibold text-white truncate">{event.name}</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {event.homeTeam && event.visitTeam && (
            <span className="hidden sm:block text-xs text-gray-400 font-medium">
              {event.homeTeam.shortName} <span className="text-gray-600">vs</span> {event.visitTeam.shortName}
            </span>
          )}

          {event.status === 'LIVE' ? (
            <span className="flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 bg-red-900/50 text-red-400 ring-1 ring-red-700 tag-live">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> LIVE
            </span>
          ) : (
            <span className="text-xs rounded-full px-2.5 py-1 bg-gray-800 text-gray-400">{event.status}</span>
          )}

          {/* Debug clear tags */}
          {tags.length > 0 && (
            <button
              onClick={() => confirm(`Delete all ${tags.length} tags?`) && clearAllTags(token!)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1 touch-manipulation"
              title="Clear all tags"
            >
              🗑
            </button>
          )}

          {/* ⚙ Settings gear */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors touch-manipulation"
            title="Tag Names & Colours"
            aria-label="Open tag names and colour settings"
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

          {/* Tag timeline — filtered by activeColours */}
          <TagTimeline
            tags={tags}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            activeColours={activeColours}
          />

          {/* Controls bar */}
          <ControlsBar
            defaultSport={activeSport}
            currentTime={currentTime}
            comment={comment}
            setComment={setComment}
            onSportChange={handleSportChange}
            onPeriodChange={setActivePeriod}
            onPlayersChange={setSelectedPlayers}
            onRatingChange={setRating}
            onCoachPickChange={setCoachPick}
            activeColours={activeColours}
            onColourFilterChange={setActiveColours}
            activeSport={activeSport}
            activePeriod={activePeriod}
            selectedPlayers={selectedPlayers}
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
        colourMap={colourMap}
        nameMap={nameMap}
        onSetColour={setColour}
        onSetName={setName}
        onResetAll={resetAll}
      />
    </main>
  )
}

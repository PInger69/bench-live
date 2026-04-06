'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { TagTimeline } from '@/components/player/TagTimeline'
import { TagButtons } from '@/components/tagger/TagButtons'
import { ControlsBar, PERIODS, TAG_SETS, TAG_COLOURS } from '@/components/tagger/ControlsBar'
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

  // Tagger state
  const defaultSport = (event?.sportType ?? 'SOCCER') as string
  const [activeSport, setActiveSport] = useState(defaultSport)
  const [activePeriod, setActivePeriod] = useState(PERIODS[defaultSport]?.[0] ?? '1H')
  const [activeColour, setActiveColour] = useState(user?.colour ?? TAG_COLOURS[0].value)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [rating, setRating] = useState(0)
  const [coachPick, setCoachPick] = useState(false)
  const [comment, setComment] = useState('')
  const [tagging, setTagging] = useState<string | null>(null)
  const [lastTagged, setLastTagged] = useState<string | null>(null)

  function handleSportChange(sport: string) {
    setActiveSport(sport)
    setActivePeriod(PERIODS[sport]?.[0] ?? 'P1')
  }

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time)
  }, [])

  async function handleTag(name: string) {
    if (!user || tagging || !token) return
    setTagging(name)
    try {
      const tag = await apiFetch<Tag>('/api/tags', token, {
        method: 'POST',
        body: JSON.stringify({
          eventId: id,
          type: TagType.NORMAL,
          name,
          time: currentTime,
          duration: 30,
          colour: activeColour,
          period: activePeriod,
          players: selectedPlayers,
          comment: comment || undefined,
          rating: rating || undefined,
          coachPick,
        }),
      })
      addTag(tag)
      setLastTagged(name)
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

  // Sync sport with event type once loaded
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

  const allTagNames = TAG_SETS[activeSport] ?? TAG_SETS.GENERIC
  const mid = Math.ceil(allTagNames.length / 2)
  const leftTags = allTagNames.slice(0, mid)
  const rightTags = allTagNames.slice(mid)
  const primaryFeed = event.feeds?.[0] ?? null

  return (
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => router.push('/events')} className="text-gray-400 hover:text-white text-sm flex-shrink-0">
            ← Events
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
            <span className="flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-1 bg-red-900/50 text-red-400 ring-1 ring-red-700 tag-live">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> LIVE
            </span>
          ) : (
            <span className="text-xs rounded-full px-3 py-1 bg-gray-800 text-gray-400">{event.status}</span>
          )}
          {/* Debug: clear all tags */}
          {tags.length > 0 && (
            <button
              onClick={() => confirm(`Delete all ${tags.length} tags?`) && clearAllTags(token!)}
              className="text-xs text-red-600 hover:text-red-400 transition-colors"
            >
              🗑
            </button>
          )}
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: user?.colour ?? '#6366F1' }}
          >
            {user?.name?.[0] ?? '?'}
          </div>
        </div>
      </header>

      {/* ── Body: Left Tags | Video+Timeline | Right Tags ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left tag buttons */}
        <TagButtons
          side="left"
          names={leftTags}
          colour={activeColour}
          disabled={!!tagging}
          tagging={tagging}
          lastTagged={lastTagged}
          onTag={handleTag}
        />

        {/* Centre column: video + timeline + controls */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Video — fills available vertical space */}
          <div className="flex-1 min-h-0 bg-black flex items-center justify-center">
            <VideoPlayer
              ref={playerRef}
              feed={primaryFeed}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />
          </div>

          {/* Tag timeline */}
          <TagTimeline
            tags={tags}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />

          {/* Controls bar */}
          <ControlsBar
            defaultSport={defaultSport}
            currentTime={currentTime}
            comment={comment}
            setComment={setComment}
            onSportChange={handleSportChange}
            onPeriodChange={setActivePeriod}
            onColourChange={setActiveColour}
            onPlayersChange={setSelectedPlayers}
            onRatingChange={setRating}
            onCoachPickChange={setCoachPick}
            activeSport={activeSport}
            activePeriod={activePeriod}
            activeColour={activeColour}
            selectedPlayers={selectedPlayers}
            rating={rating}
            coachPick={coachPick}
            lastTagged={lastTagged}
          />
        </div>

        {/* Right tag buttons */}
        <TagButtons
          side="right"
          names={rightTags}
          colour={activeColour}
          disabled={!!tagging}
          tagging={tagging}
          lastTagged={lastTagged}
          onTag={handleTag}
        />
      </div>
    </main>
  )
}

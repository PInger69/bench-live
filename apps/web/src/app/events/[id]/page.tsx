'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { VideoPlayer, type VideoPlayerHandle } from '@/components/player/VideoPlayer'
import { TaggerPanel } from '@/components/tagger/TaggerPanel'
import { TagList } from '@/components/tagger/TagList'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token, user } = useAuthStore()
  const { event, tags, loading, fetchEvent, fetchTags } = useEventDetailStore()
  const [currentTime, setCurrentTime] = useState(0)
  const playerRef = useRef<VideoPlayerHandle>(null)

  // Seek the actual video element
  function handleSeek(time: number) {
    playerRef.current?.seekTo(time)
  }

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchEvent(id, token)
    fetchTags(id, token)
  }, [id, token, fetchEvent, fetchTags, router])

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

  const primaryFeed = event.feeds?.[0] ?? null

  return (
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/events')}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 flex-shrink-0"
          >
            ← Events
          </button>
          <span className="text-gray-700">/</span>
          <h1 className="text-sm font-semibold text-white truncate">{event.name}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {event.homeTeam && event.visitTeam && (
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-white">{event.homeTeam.shortName}</span>
              <span>vs</span>
              <span className="font-medium text-white">{event.visitTeam.shortName}</span>
            </div>
          )}
          {event.status === 'LIVE' ? (
            <span className="text-xs font-bold rounded-full px-3 py-1 bg-red-900/50 text-red-400 ring-1 ring-red-700 flex items-center gap-1.5 tag-live">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              LIVE
            </span>
          ) : (
            <span className="text-xs font-medium rounded-full px-3 py-1 bg-gray-800 text-gray-400">
              {event.status}
            </span>
          )}
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: user?.colour ?? '#6366F1' }}
          >
            {user?.name?.[0] ?? '?'}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video + Tagger */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-shrink-0 bg-black" style={{ aspectRatio: '16/9', maxHeight: 'calc(100vh - 280px)' }}>
            <VideoPlayer
              ref={playerRef}
              feed={primaryFeed}
              onTimeUpdate={setCurrentTime}
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <TaggerPanel event={event} token={token!} currentTime={currentTime} />
          </div>
        </div>

        {/* Right: Tag list */}
        <aside className="w-80 xl:w-96 flex-shrink-0 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden">
          <TagList tags={tags} onSeek={handleSeek} />
        </aside>
      </div>
    </main>
  )
}

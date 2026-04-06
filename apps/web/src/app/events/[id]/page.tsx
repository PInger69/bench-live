'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useEventDetailStore } from '@/store/eventDetail'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { TaggerPanel } from '@/components/tagger/TaggerPanel'
import { TagList } from '@/components/tagger/TagList'

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuthStore()
  const { event, tags, loading, fetchEvent, fetchTags } = useEventDetailStore()

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchEvent(id, token)
    fetchTags(id, token)
  }, [id, token, fetchEvent, fetchTags, router])

  if (loading || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-400">Loading event...</p>
      </main>
    )
  }

  const primaryFeed = event.feeds?.[0]

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/events')} className="text-gray-400 hover:text-white text-sm">← Events</button>
          <span className="text-gray-600">/</span>
          <h1 className="text-sm font-semibold text-white truncate max-w-md">{event.name}</h1>
        </div>
        {event.status === 'LIVE' && (
          <span className="text-xs font-semibold rounded-full px-3 py-1 bg-red-900/40 text-red-400 ring-1 ring-red-800 tag-live">
            ● LIVE
          </span>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video + tagger area */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="video-container bg-black">
            <VideoPlayer feed={primaryFeed ?? null} />
          </div>
          <TaggerPanel event={event} token={token!} />
        </div>

        {/* Tag list sidebar */}
        <aside className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Tags <span className="text-gray-500 font-normal">({tags.length})</span></h2>
          </div>
          <TagList tags={tags} />
        </aside>
      </div>
    </main>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useEventsStore } from '@/store/events'
import { formatDate, sportLabel } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function EventsPage() {
  const router = useRouter()
  const { user, token } = useAuthStore()
  const { events, loading, fetchEvents } = useEventsStore()

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchEvents(token)
  }, [token, fetchEvents, router])

  if (!user) return null

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bench Live</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">{user.name}</span>
            <ThemeToggle />
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: user.colour }}
            >
              {user.name[0]}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h2>
        </div>

        {loading ? (
          <div className="text-gray-400 dark:text-gray-500 text-center py-20">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">No events found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="rounded-xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 p-5 hover:ring-brand-500 dark:hover:ring-brand-600 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-gray-600 dark:text-gray-400">
                    {sportLabel(event.sportType)}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                    event.status === 'LIVE'
                      ? 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {event.status === 'LIVE' ? '● LIVE' : event.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{event.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{formatDate(event.date)}</p>

                {event.homeTeam && event.visitTeam && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {event.homeTeam.name} vs {event.visitTeam.name}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{event.tagCount} tags</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{event.feeds?.length ?? 0} cameras</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

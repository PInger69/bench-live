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
    <main className="min-h-screen" style={{ background: 'var(--c-bg)' }}>
      <header
        className="px-6 py-4"
        style={{
          background: 'var(--c-surface)',
          borderBottom: '1px solid var(--c-border)',
        }}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold" style={{ color: 'var(--c-text1)' }}>Bench Live</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--c-text2)' }}>{user.name}</span>
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
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--c-text1)' }}>Events</h2>

        {loading ? (
          <div className="text-center py-20" style={{ color: 'var(--c-text2)' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--c-text2)' }}>No events found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                style={{
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-xs font-medium rounded-full px-2.5 py-1"
                    style={{ background: 'var(--c-surf2)', color: 'var(--c-text2)' }}
                  >
                    {sportLabel(event.sportType)}
                  </span>
                  <span
                    className="text-xs font-semibold rounded-full px-2.5 py-1"
                    style={
                      event.status === 'LIVE'
                        ? { background: 'rgba(220,38,38,0.12)', color: '#ef4444', outline: '1px solid rgba(220,38,38,0.35)' }
                        : { background: 'var(--c-surf2)', color: 'var(--c-text2)' }
                    }
                  >
                    {event.status === 'LIVE' ? '● LIVE' : event.status}
                  </span>
                </div>

                <h3 className="font-semibold mb-1 line-clamp-2" style={{ color: 'var(--c-text1)' }}>
                  {event.name}
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--c-text2)' }}>{formatDate(event.date)}</p>

                {event.homeTeam && event.visitTeam && (
                  <p className="text-xs" style={{ color: 'var(--c-text3)' }}>
                    {event.homeTeam.name} vs {event.visitTeam.name}
                  </p>
                )}

                <div
                  className="mt-3 pt-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--c-border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--c-text3)' }}>{event.tagCount} tags</span>
                  <span className="text-xs" style={{ color: 'var(--c-text3)' }}>{event.feeds?.length ?? 0} cameras</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

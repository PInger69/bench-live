import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8">
      <div className="text-center max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-1.5 text-sm text-brand-500 ring-1 ring-brand-500/30">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
          Beta
        </div>

        <h1 className="text-6xl font-bold tracking-tight text-white mb-4">
          Bench Live
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Professional sports video analysis. Tag moments, review footage, and coach smarter.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/events"
            className="rounded-lg bg-gray-800 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            View Events
          </Link>
        </div>
      </div>
    </main>
  )
}

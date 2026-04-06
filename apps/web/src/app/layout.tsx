import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bench Live',
  description: 'Professional Sports Video Analysis Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}

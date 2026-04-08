import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bench Live',
  description: 'Professional Sports Video Analysis Platform',
  appleWebApp: {
    capable: true,
    title: 'Bench Live',
    statusBarStyle: 'black-translucent',
  },
  manifest: '/manifest.json',
  // Spotlight indexing — helps iOS surface events in Spotlight search
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Bench Live',
    description: 'Professional Sports Video Analysis Platform',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

const themeScript = `
(function(){
  try {
    var s = localStorage.getItem('bench-live:theme');
    var preferred = s || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (preferred === 'dark') document.documentElement.classList.add('dark');
  } catch(e){}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Handoff — enables "Continue on Mac" when browsing on iPhone/iPad */}
        <meta name="apple-mobile-web-app-title" content="Bench Live" />
        {/* Spotlight indexing — iOS indexes PWAs with proper titles + descriptions */}
        <meta name="application-name" content="Bench Live" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}

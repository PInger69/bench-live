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
      </head>
      <body>{children}</body>
    </html>
  )
}

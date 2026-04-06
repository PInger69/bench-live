import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bench Live',
  description: 'Professional Sports Video Analysis Platform',
}

// Inline script injected before React hydrates so there's no flash of wrong theme.
// Reads localStorage; falls back to the OS preference.
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
      {/* suppressHydrationWarning stops React complaining that the server
          rendered without the `dark` class while the client may add it */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'bench-live:theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  // Sync React state from the actual DOM class (set by the no-FOMT script)
  useEffect(() => {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setThemeState(current)
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try { localStorage.setItem(STORAGE_KEY, next) } catch {}
      return next
    })
  }, [])

  return { theme, toggle, isDark: theme === 'dark' }
}

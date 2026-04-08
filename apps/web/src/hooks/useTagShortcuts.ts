'use client'

import { useEffect } from 'react'

/**
 * Keyboard shortcuts for rapid tagging with external keyboard (iPad Smart/Magic Keyboard).
 *
 * Maps single keys to tag names within the current sport's TAG_SETS.
 * Only fires when no text input is focused.
 */

// Sport-specific shortcut maps — first letter or intuitive key
const SHORTCUT_MAPS: Record<string, Record<string, string>> = {
  SOCCER: {
    g: 'GOAL',       s: 'SHOT ON',   o: 'SHOT OFF',  v: 'SAVE',
    c: 'CORNER',     f: 'FREE KICK', i: 'OFFSIDE',   u: 'FOUL',
    y: 'YELLOW CARD', r: 'RED CARD', x: 'SUBSTITUTION', k: 'KEY PASS',
    t: 'TACKLE',     n: 'INTERCEPTION', p: 'PENALTY',
  },
  FOOTBALL: {
    t: 'TOUCHDOWN',  f: 'FIELD GOAL', i: 'INTERCEPTION', s: 'SACK',
    u: 'FUMBLE',     p: 'PUNT',       k: 'KICKOFF',      n: 'PENALTY',
    d: '1ST DOWN',   r: 'RED ZONE',   y: 'KEY PLAY',     o: 'TURNOVER',
  },
  HOCKEY: {
    g: 'GOAL',       s: 'SHOT',      v: 'SAVE',       p: 'PENALTY',
    w: 'POWER PLAY', h: 'SHORT HANDED', f: 'FACE OFF', i: 'ICING',
    o: 'OFFSIDE',    t: 'FIGHT',     u: 'TURNOVER',   k: 'KEY PLAY',
  },
  RUGBY: {
    t: 'TRY',        c: 'CONVERSION', p: 'PENALTY GOAL', d: 'DROP GOAL',
    a: 'TACKLE',     l: 'LINEOUT',    s: 'SCRUM',        n: 'KNOCK ON',
    e: 'PENALTY',    k: 'KEY PLAY',   u: 'TURNOVER',
  },
  BASKETBALL: {
    b: 'BASKET',     t: '3 POINTER',  f: 'FREE THROW', r: 'REBOUND',
    a: 'ASSIST',     s: 'STEAL',      l: 'BLOCK',       u: 'TURNOVER',
    o: 'FOUL',       i: 'TIMEOUT',    x: 'FAST BREAK',  k: 'KEY PLAY',
  },
  GENERIC: {
    k: 'KEY MOMENT', h: 'HIGHLIGHT',  r: 'REVIEW',     g: 'GOOD',
    b: 'BAD',        t: 'TRAINING POINT', a: 'TACTIC',  n: 'NOTE',
  },
}

export function useTagShortcuts(
  sport: string,
  onTag: (tagKey: string) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return

    const map = SHORTCUT_MAPS[sport] ?? SHORTCUT_MAPS.GENERIC

    function onKey(e: KeyboardEvent) {
      // Don't fire in text inputs
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      // Don't hijack modifier combos
      if (e.metaKey || e.ctrlKey || e.altKey) return
      // Space is already play/pause
      if (e.code === 'Space') return
      // Arrow keys are already navigation
      if (e.key.startsWith('Arrow')) return

      const tagKey = map[e.key.toLowerCase()]
      if (tagKey) {
        e.preventDefault()
        onTag(tagKey)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sport, onTag, enabled])
}

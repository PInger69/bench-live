'use client'

import { useState, useEffect, useCallback } from 'react'

// Sensible colour defaults per tag name
const COLOUR_DEFAULTS: Record<string, string> = {
  // Scoring
  'GOAL':             '#EF4444',
  'TOUCHDOWN':        '#EF4444',
  'TRY':              '#EF4444',
  'BASKET':           '#EF4444',
  'FIELD GOAL':       '#EF4444',
  '3 POINTER':        '#EF4444',
  'FREE THROW':       '#EF4444',
  'PENALTY GOAL':     '#EF4444',
  'DROP GOAL':        '#EF4444',
  'CONVERSION':       '#F97316',

  // Shots / Attempts
  'SHOT ON':          '#10B981',
  'SHOT OFF':         '#F59E0B',
  'SHOT':             '#10B981',
  'SAVE':             '#3B82F6',

  // Set pieces
  'CORNER':           '#14B8A6',
  'FREE KICK':        '#14B8A6',
  'LINEOUT':          '#14B8A6',
  'SCRUM':            '#14B8A6',
  'FACE OFF':         '#14B8A6',
  'KICKOFF':          '#14B8A6',
  'PUNT':             '#14B8A6',

  // Discipline
  'YELLOW CARD':      '#F59E0B',
  'RED CARD':         '#EF4444',
  'FOUL':             '#F97316',
  'PENALTY':          '#8B5CF6',
  'PENALTY (AGAINST)':'#EF4444',

  // Possession
  'TACKLE':           '#6366F1',
  'INTERCEPTION':     '#6366F1',
  'TURNOVER':         '#EC4899',
  'STEAL':            '#EC4899',
  'FUMBLE':           '#EC4899',
  'KNOCK ON':         '#EC4899',

  // Player management
  'SUBSTITUTION':     '#8B5CF6',
  'TIMEOUT':          '#8B5CF6',

  // Analysis
  'KEY PASS':         '#10B981',
  'ASSIST':           '#10B981',
  'KEY PLAY':         '#10B981',
  'KEY MOMENT':       '#10B981',
  'HIGHLIGHT':        '#F59E0B',
  'GOOD':             '#10B981',
  'BAD':              '#EF4444',

  // Hockey specific
  'POWER PLAY':       '#8B5CF6',
  'SHORT HANDED':     '#EC4899',
  'ICING':            '#6366F1',
  'OFFSIDE':          '#F97316',
  'FIGHT':            '#EF4444',

  // Football specific
  'SACK':             '#EF4444',
  '1ST DOWN':         '#10B981',
  'RED ZONE':         '#EF4444',

  // Basketball
  'REBOUND':          '#3B82F6',
  'BLOCK':            '#6366F1',
  'FAST BREAK':       '#F59E0B',

  // Generic
  'REVIEW':           '#6366F1',
  'TRAINING POINT':   '#14B8A6',
  'TACTIC':           '#8B5CF6',
  'NOTE':             '#6B7280',
}

const COLOUR_KEY = 'bench-live:tag-colours'
const NAMES_KEY  = 'bench-live:tag-names'
const FALLBACK_COLOUR = '#3B82F6'

export type TagColourMap = Record<string, string>
export type TagNameMap   = Record<string, string>

export function useTagColours() {
  const [colourMap, setColourMap] = useState<TagColourMap>({})
  const [nameMap,   setNameMap]   = useState<TagNameMap>({})

  // Load persisted data on mount
  useEffect(() => {
    try {
      const storedColours = localStorage.getItem(COLOUR_KEY)
      if (storedColours) setColourMap(JSON.parse(storedColours))

      const storedNames = localStorage.getItem(NAMES_KEY)
      if (storedNames) setNameMap(JSON.parse(storedNames))
    } catch {}
  }, [])

  // ── Colours ────────────────────────────────────────────────────────────────

  /** Returns: user override → sensible default → fallback blue */
  const getColour = useCallback((tagKey: string): string => {
    return colourMap[tagKey] ?? COLOUR_DEFAULTS[tagKey] ?? FALLBACK_COLOUR
  }, [colourMap])

  const setColour = useCallback((tagKey: string, colour: string) => {
    setColourMap((prev) => {
      const next = { ...prev, [tagKey]: colour }
      try { localStorage.setItem(COLOUR_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const resetAllColours = useCallback(() => {
    setColourMap({})
    try { localStorage.removeItem(COLOUR_KEY) } catch {}
  }, [])

  // ── Names ──────────────────────────────────────────────────────────────────

  /** Returns: user-defined name → original key */
  const getName = useCallback((tagKey: string): string => {
    return nameMap[tagKey] ?? tagKey
  }, [nameMap])

  const setName = useCallback((tagKey: string, name: string) => {
    setNameMap((prev) => {
      const next = { ...prev, [tagKey]: name }
      try { localStorage.setItem(NAMES_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const resetAllNames = useCallback(() => {
    setNameMap({})
    try { localStorage.removeItem(NAMES_KEY) } catch {}
  }, [])

  /** Reset both colours and names */
  const resetAll = useCallback(() => {
    resetAllColours()
    resetAllNames()
  }, [resetAllColours, resetAllNames])

  return {
    // colours
    getColour, setColour, resetAllColours, colourMap,
    // names
    getName, setName, resetAllNames, nameMap,
    // combined
    resetAll,
  }
}

export { COLOUR_DEFAULTS }

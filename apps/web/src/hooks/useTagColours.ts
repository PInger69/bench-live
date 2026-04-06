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
  'SHOT ON TARGET':   '#10B981',
  'SHOT OFF TARGET':  '#F59E0B',
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
  'FREE THROW ':      '#14B8A6',

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
  'INTERCEPTION ':    '#EC4899',

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

const STORAGE_KEY = 'bench-live:tag-colours'
const FALLBACK_COLOUR = '#3B82F6'

export type TagColourMap = Record<string, string>

export function useTagColours() {
  const [colourMap, setColourMap] = useState<TagColourMap>({})

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setColourMap(JSON.parse(stored))
      }
    } catch {}
  }, [])

  // Get colour for a tag — user override > sensible default > fallback
  const getColour = useCallback((tagName: string): string => {
    return colourMap[tagName] ?? COLOUR_DEFAULTS[tagName] ?? FALLBACK_COLOUR
  }, [colourMap])

  // Set colour for a tag and persist
  const setColour = useCallback((tagName: string, colour: string) => {
    setColourMap((prev) => {
      const next = { ...prev, [tagName]: colour }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Reset all to defaults
  const resetAll = useCallback(() => {
    setColourMap({})
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return { getColour, setColour, resetAll, colourMap }
}

export { COLOUR_DEFAULTS }

'use client'

import { useState, useEffect, useRef } from 'react'
import { TAG_SETS } from '@/components/tagger/ControlsBar'
import { type TagColourMap, type TagNameMap, COLOUR_DEFAULTS } from '@/hooks/useTagColours'

// Extended palette — 20 colours in a 4×5 grid
export const PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#10B981', '#14B8A6', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#F43F5E', '#6B7280', '#1F2937',
  '#FFFFFF', '#FCD34D', '#34D399', '#7DD3FC',
]

const SPORTS = [
  { key: 'SOCCER',     label: '⚽ Soccer'     },
  { key: 'HOCKEY',     label: '🏒 Hockey'     },
  { key: 'RUGBY',      label: '🏉 Rugby'      },
  { key: 'FOOTBALL',   label: '🏈 Football'   },
  { key: 'BASKETBALL', label: '🏀 Basketball' },
  { key: 'GENERIC',    label: '📋 Generic'    },
]

interface TagColourSettingsProps {
  open: boolean
  onClose: () => void
  activeSport: string
  onSportChange: (sport: string) => void
  colourMap: TagColourMap
  nameMap: TagNameMap
  onSetColour: (tagKey: string, colour: string) => void
  onSetName: (tagKey: string, name: string) => void
  onResetAll: () => void
}

export function TagColourSettings({
  open, onClose, activeSport, onSportChange,
  colourMap, nameMap,
  onSetColour, onSetName, onResetAll,
}: TagColourSettingsProps) {
  const [viewSport, setViewSport]       = useState(activeSport)
  const [openPickerFor, setOpenPickerFor] = useState<string | null>(null)
  const [hexDraft, setHexDraft]         = useState<Record<string, string>>({})
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!open) setOpenPickerFor(null) }, [open])
  useEffect(() => { setViewSport(activeSport) }, [activeSport])

  // Close picker when clicking outside
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (openPickerFor && pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenPickerFor(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openPickerFor])

  if (!open) return null

  const tagKeys = TAG_SETS[viewSport] ?? TAG_SETS.GENERIC

  function handleSportChange(key: string) {
    setViewSport(key)
    onSportChange(key)
    setOpenPickerFor(null)
  }

  function handleSwatchClick(tagKey: string, colour: string) {
    onSetColour(tagKey, colour)
    setHexDraft((d) => ({ ...d, [tagKey]: colour }))
    setOpenPickerFor(null)
  }

  function handleHexInput(tagKey: string, val: string) {
    setHexDraft((d) => ({ ...d, [tagKey]: val }))
    // Apply immediately if valid 6-char hex
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onSetColour(tagKey, val)
    }
  }

  function getColour(tagKey: string) {
    return colourMap[tagKey] ?? COLOUR_DEFAULTS[tagKey] ?? '#3B82F6'
  }

  function getHex(tagKey: string) {
    return hexDraft[tagKey] ?? getColour(tagKey)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-80 z-50 flex flex-col glass"
        style={{ borderLeft: '0.5px solid var(--glass-border)' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--c-border)' }}
        >
          <div>
            <h2 className="text-sm font-bold tracking-wide" style={{ color: 'var(--c-text1)' }}>Tag Names</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text3)' }}>Rename tags · assign colours</p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs glass-elevated glass-interactive"
            style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
          >
            ✕
          </button>
        </div>

        {/* ── Sport dropdown ── */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--c-text3)' }}>
            Sport Template
          </label>
          <select
            value={viewSport}
            onChange={(e) => handleSportChange(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm font-medium focus:outline-none appearance-none glass-elevated"
            style={{
              color: 'var(--c-text1)',
              border: '0.5px solid var(--glass-border)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              paddingRight: '32px',
            }}
          >
            {SPORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* ── Tag list ── */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-px" ref={pickerRef}>
          {tagKeys.map((tagKey) => {
            const colour     = getColour(tagKey)
            const name       = nameMap[tagKey] ?? tagKey
            const pickerOpen = openPickerFor === tagKey
            const hexVal     = getHex(tagKey)

            return (
              <div key={tagKey}>
                {/* Tag row */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-default"
                  style={{ background: pickerOpen ? 'var(--c-surf2)' : 'transparent' }}
                >
                  {/* Colour preview chip — click to open picker */}
                  <button
                    onClick={() => setOpenPickerFor(pickerOpen ? null : tagKey)}
                    title="Change colour"
                    className="flex-shrink-0 rounded-md transition-all touch-manipulation"
                    style={{
                      width: 28,
                      height: 20,
                      background: colour,
                      outline: pickerOpen ? '2px solid var(--c-text1)' : '1px solid rgba(0,0,0,0.2)',
                      outlineOffset: pickerOpen ? '2px' : '0',
                      transform: pickerOpen ? 'scale(1.1)' : undefined,
                    }}
                  />

                  {/* Editable name */}
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => onSetName(tagKey, e.target.value)}
                    onBlur={(e) => { if (!e.target.value.trim()) onSetName(tagKey, tagKey) }}
                    className="flex-1 bg-transparent text-sm font-medium focus:outline-none min-w-0"
                    style={{ color: 'var(--c-text1)' }}
                    placeholder={tagKey}
                  />

                  {/* Chevron */}
                  <svg
                    className="flex-shrink-0 transition-transform"
                    style={{
                      width: 14, height: 14,
                      color: 'var(--c-text3)',
                      transform: pickerOpen ? 'rotate(180deg)' : undefined,
                    }}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </div>

                {/* ── Colour picker panel ── */}
                {pickerOpen && (
                  <div
                    className="mx-2 mb-2 rounded-xl p-3 space-y-3 glass-elevated relative"
                    style={{
                      border: '0.5px solid var(--glass-border)',
                    }}
                  >
                    {/* Current colour + hex input */}
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-lg flex-shrink-0 shadow-sm"
                        style={{ width: 36, height: 36, background: colour }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: 'var(--c-border2)' }}>
                          <span className="px-2 text-xs font-mono font-bold" style={{ color: 'var(--c-text3)', background: 'var(--c-surf2)' }}>#</span>
                          <input
                            type="text"
                            value={hexVal.replace('#', '')}
                            maxLength={6}
                            onChange={(e) => handleHexInput(tagKey, '#' + e.target.value)}
                            className="flex-1 px-2 py-1.5 text-xs font-mono focus:outline-none"
                            style={{ background: 'var(--c-surf2)', color: 'var(--c-text1)' }}
                            placeholder="3B82F6"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Swatch grid — 4 columns of rounded squares */}
                    <div className="grid grid-cols-10 gap-1.5">
                      {PALETTE.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleSwatchClick(tagKey, c)}
                          className="touch-manipulation transition-all"
                          title={c}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: c,
                            borderRadius: 5,
                            outline: colour === c
                              ? '2px solid var(--c-text1)'
                              : '1px solid rgba(0,0,0,0.15)',
                            outlineOffset: colour === c ? '1px' : '0',
                            transform: colour === c ? 'scale(1.15)' : undefined,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--c-border)' }}
        >
          <button
            onClick={() => { if (confirm('Reset all tag names and colours to defaults?')) onResetAll() }}
            className="text-xs transition-colors"
            style={{ color: 'var(--c-text3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--c-text3)' }}
          >
            Reset to defaults
          </button>
          <button
            onClick={onClose}
            className="text-sm font-semibold px-5 py-2 rounded-xl touch-manipulation glass-elevated glass-interactive"
            style={{
              color: 'var(--c-tint)',
              border: '0.5px solid var(--glass-border)',
            }}
          >
            Done
          </button>
        </div>
      </aside>
    </>
  )
}

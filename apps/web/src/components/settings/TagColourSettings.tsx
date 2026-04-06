'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TAG_SETS } from '@/components/tagger/ControlsBar'
import { type TagColourMap, type TagNameMap, COLOUR_DEFAULTS } from '@/hooks/useTagColours'

export const PALETTE = [
  { value: '#EF4444', label: 'Red'    },
  { value: '#F97316', label: 'Orange' },
  { value: '#F59E0B', label: 'Amber'  },
  { value: '#10B981', label: 'Green'  },
  { value: '#14B8A6', label: 'Teal'   },
  { value: '#3B82F6', label: 'Blue'   },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink'   },
  { value: '#6B7280', label: 'Gray'   },
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
  colourMap: TagColourMap
  nameMap: TagNameMap
  onSetColour: (tagKey: string, colour: string) => void
  onSetName: (tagKey: string, name: string) => void
  onResetAll: () => void
}

export function TagColourSettings({
  open, onClose, activeSport,
  colourMap, nameMap,
  onSetColour, onSetName, onResetAll,
}: TagColourSettingsProps) {
  const [viewSport, setViewSport] = useState(activeSport)
  const [openPickerFor, setOpenPickerFor] = useState<string | null>(null)

  useEffect(() => { if (!open) setOpenPickerFor(null) }, [open])

  if (!open) return null

  const tagKeys = TAG_SETS[viewSport] ?? TAG_SETS.GENERIC

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col shadow-2xl border-l border-theme"
        style={{ background: 'var(--c-surface)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
          <div>
            <h2 className="text-base font-bold text-theme1">Tag Names</h2>
            <p className="text-xs text-theme2 mt-0.5">Rename tags and assign colours</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center transition-colors text-theme2 hover:text-theme1"
            style={{ background: 'var(--c-surf2)' }}
          >
            ✕
          </button>
        </div>

        {/* Sport tabs */}
        <div className="flex overflow-x-auto gap-1 px-3 py-2.5 border-b border-theme scrollbar-none">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setViewSport(s.key); setOpenPickerFor(null) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation transition-colors"
              style={
                viewSport === s.key
                  ? { background: '#2563EB', color: '#fff' }
                  : { background: 'var(--c-surf2)', color: 'var(--c-text2)' }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {tagKeys.map((tagKey) => {
            const currentColour = colourMap[tagKey] ?? COLOUR_DEFAULTS[tagKey] ?? '#3B82F6'
            const currentName   = nameMap[tagKey] ?? tagKey
            const pickerOpen    = openPickerFor === tagKey

            return (
              <div
                key={tagKey}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--c-surf2)', outline: `1px solid var(--c-border)` }}
              >
                {/* Row */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  {/* Colour swatch */}
                  <button
                    onClick={() => setOpenPickerFor(pickerOpen ? null : tagKey)}
                    className={cn('flex-shrink-0 h-7 w-7 rounded-full touch-manipulation shadow-sm transition-all', pickerOpen && 'scale-110')}
                    style={{
                      background: currentColour,
                      outline: pickerOpen ? `2px solid var(--c-text1)` : undefined,
                      outlineOffset: pickerOpen ? '2px' : undefined,
                    }}
                    title="Pick colour"
                  />

                  {/* Editable name */}
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => onSetName(tagKey, e.target.value)}
                    onBlur={(e) => { if (!e.target.value.trim()) onSetName(tagKey, tagKey) }}
                    className="flex-1 bg-transparent text-sm font-semibold border-b border-transparent focus:outline-none py-0.5 transition-colors"
                    style={{
                      color: 'var(--c-text1)',
                      borderBottomColor: 'transparent',
                    }}
                    onFocus={(e) => { e.target.style.borderBottomColor = 'var(--c-border2)' }}
                    placeholder={tagKey}
                  />

                  {/* Chevron */}
                  <svg
                    className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform', pickerOpen && 'rotate-180')}
                    style={{ color: 'var(--c-text3)' }}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </div>

                {/* Colour picker */}
                {pickerOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-theme">
                    <p className="text-xs mb-2 text-theme3">Choose a colour</p>
                    <div className="flex flex-wrap gap-2">
                      {PALETTE.map((c) => (
                        <button
                          key={c.value}
                          title={c.label}
                          onClick={() => { onSetColour(tagKey, c.value); setOpenPickerFor(null) }}
                          className="h-8 w-8 rounded-full touch-manipulation transition-all flex-shrink-0 shadow-sm"
                          style={{
                            background: c.value,
                            opacity: currentColour === c.value ? 1 : 0.6,
                            transform: currentColour === c.value ? 'scale(1.15)' : undefined,
                            outline: currentColour === c.value ? `2px solid var(--c-text1)` : undefined,
                            outlineOffset: currentColour === c.value ? '2px' : undefined,
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
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
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-xl touch-manipulation transition-colors"
          >
            Done
          </button>
        </div>
      </aside>
    </>
  )
}

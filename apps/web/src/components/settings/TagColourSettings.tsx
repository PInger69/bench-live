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
  onSetColour, onSetName,
  onResetAll,
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
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer — slides in from right */}
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Tag Names</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Rename tags and assign colours</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sport tabs */}
        <div className="flex overflow-x-auto gap-1 px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 scrollbar-none">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setViewSport(s.key); setOpenPickerFor(null) }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation transition-colors',
                viewSport === s.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
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
              <div key={tagKey} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl overflow-hidden ring-1 ring-gray-100 dark:ring-gray-700/50">
                {/* Main row */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  {/* Colour swatch button — opens picker */}
                  <button
                    onClick={() => setOpenPickerFor(pickerOpen ? null : tagKey)}
                    className={cn(
                      'flex-shrink-0 h-7 w-7 rounded-full transition-all touch-manipulation shadow-sm',
                      pickerOpen
                        ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800 scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{ background: currentColour }}
                    title="Pick colour"
                    aria-label={`Pick colour for ${currentName}`}
                  />

                  {/* Editable name */}
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => onSetName(tagKey, e.target.value)}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) onSetName(tagKey, tagKey)
                    }}
                    className="flex-1 bg-transparent text-sm font-semibold text-gray-900 dark:text-white border-b border-transparent focus:border-gray-300 dark:focus:border-gray-600 focus:outline-none placeholder-gray-400 py-0.5 transition-colors"
                    placeholder={tagKey}
                  />

                  {/* Chevron hint */}
                  <svg
                    className={cn('w-3.5 h-3.5 text-gray-400 dark:text-gray-600 transition-transform flex-shrink-0', pickerOpen && 'rotate-180')}
                    viewBox="0 0 20 20" fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </div>

                {/* Colour picker — inline */}
                {pickerOpen && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700/50">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Choose a colour</p>
                    <div className="flex flex-wrap gap-2">
                      {PALETTE.map((c) => (
                        <button
                          key={c.value}
                          title={c.label}
                          onClick={() => { onSetColour(tagKey, c.value); setOpenPickerFor(null) }}
                          className={cn(
                            'h-8 w-8 rounded-full touch-manipulation transition-all flex-shrink-0 shadow-sm',
                            currentColour === c.value
                              ? 'ring-2 ring-gray-900 dark:ring-white ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-800 scale-110'
                              : 'opacity-60 hover:opacity-100 hover:scale-105'
                          )}
                          style={{ background: c.value }}
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
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={() => { if (confirm('Reset all tag names and colours to defaults?')) onResetAll() }}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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

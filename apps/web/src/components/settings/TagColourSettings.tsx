'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TAG_SETS } from '@/components/tagger/ControlsBar'
import { type TagColourMap, COLOUR_DEFAULTS } from '@/hooks/useTagColours'

const PALETTE = [
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
  onSetColour: (tag: string, colour: string) => void
  onResetAll: () => void
}

export function TagColourSettings({
  open, onClose, activeSport, colourMap, onSetColour, onResetAll,
}: TagColourSettingsProps) {
  const [viewSport, setViewSport] = useState(activeSport)
  const tagNames = TAG_SETS[viewSport] ?? TAG_SETS.GENERIC

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer - slides in from right */}
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-gray-900 border-l border-gray-700 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-bold text-white">Tag Colours</h2>
            <p className="text-xs text-gray-400 mt-0.5">Assign a colour to each tag type</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sport tabs */}
        <div className="flex overflow-x-auto gap-1 px-3 py-2.5 border-b border-gray-800 scrollbar-none">
          {SPORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setViewSport(s.key)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation transition-colors',
                viewSport === s.key ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 active:bg-gray-700'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tag list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {tagNames.map((tag) => {
            const current = colourMap[tag] ?? COLOUR_DEFAULTS[tag] ?? '#3B82F6'
            return (
              <div key={tag} className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-3 py-2.5">
                {/* Preview */}
                <div
                  className="flex-shrink-0 h-8 w-1 rounded-full"
                  style={{ background: current }}
                />
                <span className="flex-1 text-sm font-semibold text-white">{tag}</span>

                {/* Colour swatches */}
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {PALETTE.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => onSetColour(tag, c.value)}
                      className={cn(
                        'h-6 w-6 rounded-full touch-manipulation transition-all flex-shrink-0',
                        current === c.value
                          ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110'
                          : 'opacity-60 hover:opacity-100'
                      )}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={() => { if (confirm('Reset all tag colours to defaults?')) onResetAll() }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
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

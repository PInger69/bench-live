'use client'

import { useState } from 'react'
import type { Feed } from '@bench-live/shared'

export type ViewMode = 'single' | 'quad'

interface SourceSelectorProps {
  feeds: Feed[]
  activeFeedId: string | null
  viewMode: ViewMode
  onSelectFeed: (feedId: string) => void
  onSetViewMode: (mode: ViewMode) => void
}

/**
 * Top-dead-centre source selector — a row of rectangles indicating camera sources.
 * The final rectangle is a quad-view icon (2x2 grid) to show all sources at once.
 *
 * Styled in Liquid Glass: frosted bg, specular highlights, interactive hover/press.
 */
export function SourceSelector({
  feeds, activeFeedId, viewMode, onSelectFeed, onSetViewMode,
}: SourceSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (feeds.length <= 1) return null

  return (
    <div className="flex items-center gap-1.5">
      {/* Individual source rectangles */}
      {feeds.map((feed, i) => {
        const isActive = viewMode === 'single' && feed.id === activeFeedId
        return (
          <button
            key={feed.id}
            onClick={() => { onSetViewMode('single'); onSelectFeed(feed.id) }}
            onMouseEnter={() => setHoveredId(feed.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative group glass-interactive touch-manipulation"
            title={feed.label}
            style={{
              width: 36,
              height: 24,
              borderRadius: 4,
              background: isActive ? 'var(--c-tint)' : 'var(--glass-bg-elevated)',
              border: isActive
                ? '1.5px solid var(--c-tint)'
                : '0.5px solid var(--glass-border)',
              boxShadow: isActive
                ? '0 0 8px rgba(0,122,255,0.4), inset 0 0.5px 0 rgba(255,255,255,0.2)'
                : undefined,
            }}
          >
            {/* Source number */}
            <span
              className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
              style={{ color: isActive ? '#fff' : 'var(--c-text2)' }}
            >
              {i + 1}
            </span>

            {/* Tooltip on hover */}
            {hoveredId === feed.id && (
              <div
                className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              >
                <div
                  className="glass-elevated rounded-lg px-2 py-1 whitespace-nowrap text-[10px] font-medium"
                  style={{
                    color: 'var(--c-text1)',
                    border: '0.5px solid var(--glass-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {feed.label}
                </div>
              </div>
            )}
          </button>
        )
      })}

      {/* Quad-view rectangle — only if 2+ sources */}
      {feeds.length >= 2 && (
        <button
          onClick={() => onSetViewMode(viewMode === 'quad' ? 'single' : 'quad')}
          onMouseEnter={() => setHoveredId('quad')}
          onMouseLeave={() => setHoveredId(null)}
          className="relative glass-interactive touch-manipulation"
          title="Multi-view"
          style={{
            width: 36,
            height: 24,
            borderRadius: 4,
            background: viewMode === 'quad' ? 'var(--c-tint)' : 'var(--glass-bg-elevated)',
            border: viewMode === 'quad'
              ? '1.5px solid var(--c-tint)'
              : '0.5px solid var(--glass-border)',
            boxShadow: viewMode === 'quad'
              ? '0 0 8px rgba(0,122,255,0.4), inset 0 0.5px 0 rgba(255,255,255,0.2)'
              : undefined,
          }}
        >
          {/* 2x2 quad grid icon */}
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              width="16" height="12" viewBox="0 0 16 12"
              fill="none"
              stroke={viewMode === 'quad' ? '#fff' : 'var(--c-text2)'}
              strokeWidth="1.2"
            >
              <rect x="1" y="1" width="6" height="4" rx="0.5" />
              <rect x="9" y="1" width="6" height="4" rx="0.5" />
              <rect x="1" y="7" width="6" height="4" rx="0.5" />
              <rect x="9" y="7" width="6" height="4" rx="0.5" />
            </svg>
          </span>

          {hoveredId === 'quad' && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
              <div
                className="glass-elevated rounded-lg px-2 py-1 whitespace-nowrap text-[10px] font-medium"
                style={{
                  color: 'var(--c-text1)',
                  border: '0.5px solid var(--glass-border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                Multi-view
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  )
}

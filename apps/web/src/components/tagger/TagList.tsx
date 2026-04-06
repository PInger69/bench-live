'use client'

import { useState, useMemo } from 'react'
import type { Tag } from '@bench-live/shared'
import { formatTime, cn } from '@/lib/utils'

interface TagListProps {
  tags: Tag[]
  onSeek?: (time: number) => void
}

export function TagList({ tags, onSeek }: TagListProps) {
  const [search, setSearch] = useState('')
  const [filterCoachPick, setFilterCoachPick] = useState(false)
  const [filterMinRating, setFilterMinRating] = useState(0)
  const [filterPeriod, setFilterPeriod] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Get unique periods from tags
  const periods = useMemo(() => {
    const set = new Set(tags.map((t) => t.period).filter(Boolean) as string[])
    return Array.from(set)
  }, [tags])

  const filtered = useMemo(() => {
    return tags.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !(t.comment?.toLowerCase().includes(search.toLowerCase()))) return false
      if (filterCoachPick && !t.coachPick) return false
      if (filterMinRating > 0 && (t.rating ?? 0) < filterMinRating) return false
      if (filterPeriod && t.period !== filterPeriod) return false
      return true
    })
  }, [tags, search, filterCoachPick, filterMinRating, filterPeriod])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter bar */}
      <div className="flex-shrink-0 p-3 border-b border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Tags <span className="text-gray-500 font-normal text-xs">({filtered.length}/{tags.length})</span>
          </h2>
          {(filterCoachPick || filterMinRating > 0 || filterPeriod || search) && (
            <button
              onClick={() => { setSearch(''); setFilterCoachPick(false); setFilterMinRating(0); setFilterPeriod('') }}
              className="text-xs text-gray-500 hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
        />

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterCoachPick(!filterCoachPick)}
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
              filterCoachPick ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            ★ Coach Pick
          </button>

          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setFilterMinRating(filterMinRating === r ? 0 : r)}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                filterMinRating === r ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {r}★+
            </button>
          ))}

          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(filterPeriod === p ? '' : p)}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                filterPeriod === p ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tag items */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {tags.length === 0 ? (
              <>
                <p className="text-sm text-gray-400 mb-1">No tags yet</p>
                <p className="text-xs text-gray-600">Use the buttons below the video to tag moments</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No tags match your filters</p>
            )}
          </div>
        ) : (
          filtered.map((tag) => (
            <TagItem
              key={tag.id}
              tag={tag}
              expanded={expandedId === tag.id}
              onToggle={() => setExpandedId(expandedId === tag.id ? null : tag.id)}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TagItem({ tag, expanded, onToggle, onSeek }: {
  tag: Tag
  expanded: boolean
  onToggle: () => void
  onSeek?: (time: number) => void
}) {
  return (
    <div
      className={cn(
        'border-b border-gray-800 transition-colors',
        expanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'
      )}
    >
      <div
        className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer"
        onClick={onToggle}
      >
        {/* Colour dot */}
        <div
          className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ background: tag.colour }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-semibold text-white leading-tight">{tag.name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {tag.coachPick && <span className="text-yellow-400 text-xs">★</span>}
              <button
                onClick={(e) => { e.stopPropagation(); onSeek?.(tag.time) }}
                className="text-xs text-gray-500 hover:text-brand-400 font-mono transition-colors"
                title="Jump to this moment"
              >
                {formatTime(tag.time)}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {tag.period && (
              <span className="text-xs text-gray-500">{tag.period}</span>
            )}
            {tag.rating != null && tag.rating > 0 && (
              <span className="text-xs text-yellow-400/70">
                {'★'.repeat(tag.rating)}
              </span>
            )}
            {tag.players && tag.players.length > 0 && (
              <span className="text-xs text-gray-500 truncate">
                {tag.players.slice(0, 2).join(', ')}{tag.players.length > 2 ? ` +${tag.players.length - 2}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-8 pb-3 space-y-1.5">
          {tag.comment && (
            <p className="text-xs text-gray-300 italic">"{tag.comment}"</p>
          )}
          {tag.players && tag.players.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tag.players.map((p) => (
                <span key={p} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{p}</span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onSeek?.(tag.time)}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              ▶ Jump to {formatTime(tag.time)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

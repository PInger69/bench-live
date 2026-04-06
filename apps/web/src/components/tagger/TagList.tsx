'use client'

import type { Tag } from '@bench-live/shared'
import { formatTime } from '@/lib/utils'

interface TagListProps {
  tags: Tag[]
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-gray-500 text-center">No tags yet.<br />Use the buttons below to tag moments.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-start gap-3 px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <div
            className="mt-0.5 h-3 w-3 rounded-full flex-shrink-0"
            style={{ background: tag.colour }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white truncate">{tag.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(tag.time)}</span>
            </div>
            {tag.comment && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{tag.comment}</p>
            )}
            {tag.players && tag.players.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{tag.players.join(', ')}</p>
            )}
            {tag.rating && (
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-xs ${s <= tag.rating! ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                ))}
              </div>
            )}
          </div>
          {tag.coachPick && (
            <span className="text-xs text-yellow-400 flex-shrink-0">★</span>
          )}
        </div>
      ))}
    </div>
  )
}

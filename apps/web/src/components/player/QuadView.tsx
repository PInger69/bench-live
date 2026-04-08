'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { Feed } from '@bench-live/shared'

interface QuadViewProps {
  feeds: Feed[]
  currentTime: number
  onSelectFeed: (feedId: string) => void
  onExitQuad: () => void
}

/**
 * 2×2 (or 2×1 / 1×1 depending on feed count) multi-camera grid.
 * Each cell has its own <video> element synced to the same currentTime.
 * Tap a cell to switch to single-view for that source.
 *
 * Styled in Liquid Glass with specular border highlights between cells.
 */
export function QuadView({ feeds, currentTime, onSelectFeed, onExitQuad }: QuadViewProps) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const hlsRefs = useRef<unknown[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Determine grid layout
  const count = feeds.length
  const cols = count <= 1 ? 1 : 2
  const rows = count <= 2 ? 1 : 2

  // Init each video element
  useEffect(() => {
    const cleanups: (() => void)[] = []

    feeds.forEach((feed, i) => {
      const video = videoRefs.current[i]
      if (!video) return

      const url = feed.hlsUrl ?? feed.mp4Url
      if (!url) return

      // Destroy previous HLS instance for this slot
      const prevHls = hlsRefs.current[i] as { destroy?: () => void } | null
      prevHls?.destroy?.()
      hlsRefs.current[i] = null

      async function init() {
        if (url!.includes('.m3u8')) {
          const Hls = (await import('hls.js')).default
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false, maxBufferLength: 10 })
            hlsRefs.current[i] = hls
            hls.loadSource(url!)
            hls.attachMedia(video!)
          } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
            video!.src = url!
          }
        } else {
          video!.src = url!
        }

        // Seek to current position and play muted
        video!.currentTime = currentTime
        video!.muted = true
        video!.play().catch(() => {})
      }

      init()
      cleanups.push(() => {
        const hls = hlsRefs.current[i] as { destroy?: () => void } | null
        hls?.destroy?.()
        hlsRefs.current[i] = null
      })
    })

    return () => cleanups.forEach((fn) => fn())
  }, [feeds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodically sync all videos to within ±0.5s of each other
  useEffect(() => {
    const interval = setInterval(() => {
      const master = videoRefs.current[0]
      if (!master) return
      const t = master.currentTime
      for (let i = 1; i < feeds.length; i++) {
        const v = videoRefs.current[i]
        if (v && Math.abs(v.currentTime - t) > 0.5) {
          v.currentTime = t
        }
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [feeds.length])

  const handleCellClick = useCallback((feed: Feed) => {
    // Pause all quad videos before switching
    videoRefs.current.forEach((v) => v?.pause())
    onSelectFeed(feed.id)
    onExitQuad()
  }, [onSelectFeed, onExitQuad])

  return (
    <div
      className="absolute inset-0 grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        background: 'var(--c-border)',
      }}
    >
      {feeds.slice(0, 4).map((feed, i) => (
        <div
          key={feed.id}
          className="relative bg-black cursor-pointer overflow-hidden"
          onClick={() => handleCellClick(feed)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            outline: hoveredIdx === i ? '2px solid var(--c-tint)' : undefined,
            outlineOffset: -2,
            transition: 'outline 0.15s ease',
          }}
        >
          <video
            ref={(el) => { videoRefs.current[i] = el }}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            muted
            preload="auto"
          />

          {/* Source label — glass pill bottom-left */}
          <div
            className="absolute bottom-2 left-2 z-10 text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              background: 'rgba(0,0,0,0.60)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.10)',
            }}
          >
            {feed.label}
          </div>

          {/* Source number — top-left */}
          <div
            className="absolute top-2 left-2 z-10 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              border: '0.5px solid rgba(255,255,255,0.10)',
            }}
          >
            {i + 1}
          </div>

          {/* Hover expand icon */}
          {hoveredIdx === i && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 40, height: 40,
                  background: 'rgba(30,30,35,0.55)',
                  backdropFilter: 'saturate(200%) blur(40px)',
                  WebkitBackdropFilter: 'saturate(200%) blur(40px)',
                  boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

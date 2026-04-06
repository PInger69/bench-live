'use client'

import { useEffect, useRef } from 'react'
import type { Feed } from '@bench-live/shared'

interface VideoPlayerProps {
  feed: Feed | null
  onTimeUpdate?: (time: number) => void
}

export function VideoPlayer({ feed, onTimeUpdate }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<unknown>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !feed) return

    const url = feed.hlsUrl ?? feed.mp4Url
    if (!url) return

    async function init() {
      if (url!.includes('.m3u8')) {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(url!)
          hls.attachMedia(video!)
        } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
          video!.src = url!
        }
      } else {
        video!.src = url!
      }
    }

    init()

    return () => {
      const hls = hlsRef.current as { destroy?: () => void } | null
      hls?.destroy?.()
    }
  }, [feed])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !onTimeUpdate) return
    const handler = () => onTimeUpdate(video.currentTime)
    video.addEventListener('timeupdate', handler)
    return () => video.removeEventListener('timeupdate', handler)
  }, [onTimeUpdate])

  if (!feed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <p className="text-gray-500 text-sm">No video source available</p>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full"
      controls
      playsInline
    />
  )
}

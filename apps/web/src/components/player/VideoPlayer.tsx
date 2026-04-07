'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import type { Feed } from '@bench-live/shared'

export interface VideoPlayerHandle {
  seekTo: (time: number) => void
  togglePlay: () => void
}

interface VideoPlayerProps {
  feed: Feed | null
  onTimeUpdate?: (time: number) => void
  onDurationChange?: (duration: number) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ feed, onTimeUpdate, onDurationChange }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const hlsRef   = useRef<unknown>(null)
    const [playing,  setPlaying]  = useState(false)
    const [muted,    setMuted]    = useState(false)
    const [showIcon, setShowIcon] = useState(false)
    const iconTimer = useRef<ReturnType<typeof setTimeout>>()

    // ── Expose handle ──────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        const v = videoRef.current
        if (!v) return
        v.currentTime = time
        v.play().catch(() => {})
      },
      togglePlay: () => {
        const v = videoRef.current
        if (!v) return
        if (v.paused) v.play().catch(() => {}); else v.pause()
      },
    }))

    // ── Flash icon helper ──────────────────────────────────────────────────
    const flashIcon = useCallback(() => {
      setShowIcon(true)
      clearTimeout(iconTimer.current)
      iconTimer.current = setTimeout(() => setShowIcon(false), 700)
    }, [])

    // ── HLS init ──────────────────────────────────────────────────────────
    useEffect(() => {
      const video = videoRef.current
      if (!video || !feed) return

      const url = feed.hlsUrl ?? feed.mp4Url
      if (!url) return

      const prevHls = hlsRef.current as { destroy?: () => void } | null
      prevHls?.destroy?.()
      hlsRef.current = null

      async function init() {
        if (url!.includes('.m3u8')) {
          const Hls = (await import('hls.js')).default
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true })
            hlsRef.current = hls
            hls.loadSource(url!)
            hls.attachMedia(video!)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video!.play().catch(() => {})
            })
          } else if (video!.canPlayType('application/vnd.apple.mpegurl')) {
            video!.src = url!
          }
        } else {
          video!.src = url!
        }
      }

      init()
      return () => { (hlsRef.current as { destroy?: () => void } | null)?.destroy?.() }
    }, [feed?.id, feed?.hlsUrl, feed?.mp4Url])

    // ── Time / duration / play-state listeners ────────────────────────────
    useEffect(() => {
      const video = videoRef.current
      if (!video) return
      const onTime     = () => onTimeUpdate?.(video.currentTime)
      const onDuration = () => onDurationChange?.(video.duration)
      const onPlay     = () => setPlaying(true)
      const onPause    = () => setPlaying(false)
      video.addEventListener('timeupdate',     onTime)
      video.addEventListener('durationchange', onDuration)
      video.addEventListener('loadedmetadata', onDuration)
      video.addEventListener('play',           onPlay)
      video.addEventListener('pause',          onPause)
      return () => {
        video.removeEventListener('timeupdate',     onTime)
        video.removeEventListener('durationchange', onDuration)
        video.removeEventListener('loadedmetadata', onDuration)
        video.removeEventListener('play',           onPlay)
        video.removeEventListener('pause',          onPause)
      }
    }, [onTimeUpdate, onDurationChange])

    // ── Space bar = play/pause (when no input focused) ────────────────────
    useEffect(() => {
      function onKey(e: KeyboardEvent) {
        if (e.code !== 'Space') return
        const t = e.target as HTMLElement
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
        e.preventDefault()
        const v = videoRef.current
        if (!v) return
        if (v.paused) { v.play().catch(() => {}); flashIcon() }
        else          { v.pause(); flashIcon() }
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [flashIcon])

    if (!feed) {
      return (
        <div
          className="flex h-full w-full items-center justify-center text-sm"
          style={{ background: '#111', color: '#6b7280' }}
        >
          No video source available
        </div>
      )
    }

    function handleClick() {
      const v = videoRef.current
      if (!v) return
      if (v.paused) { v.play().catch(() => {}); flashIcon() }
      else          { v.pause(); flashIcon() }
    }

    function toggleMute() {
      const v = videoRef.current
      if (!v) return
      v.muted = !v.muted
      setMuted(v.muted)
    }

    return (
      <div className="relative h-full w-full bg-black" style={{ cursor: 'pointer' }}>
        {/* Video — no native controls */}
        <video
          ref={videoRef}
          className="h-full w-full bg-black"
          playsInline
          onClick={handleClick}
        />

        {/* Play/Pause flash icon */}
        {showIcon && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: showIcon ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            <div
              className="rounded-full flex items-center justify-center"
              style={{ width: 64, height: 64, background: 'rgba(0,0,0,0.55)' }}
            >
              {playing ? (
                /* Pause icon */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="4" width="4" height="16" rx="1"/>
                  <rect x="15" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                /* Play icon */
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Minimal controls — bottom-right corner */}
        <div
          className="absolute bottom-2 right-3 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
          style={{ pointerEvents: 'all' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="rounded-full flex items-center justify-center transition-colors"
            style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.55)', color: '#fff' }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="rounded-full flex items-center justify-center"
            style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.55)', color: '#fff' }}
            title="Fullscreen"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }
)

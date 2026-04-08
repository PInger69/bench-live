'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import type { Feed } from '@bench-live/shared'

export interface VideoPlayerHandle {
  seekTo:     (time: number) => void  // tap-to-seek: seek then resume playing
  beginScrub: () => void              // call on scrub start: pause + record state
  scrub:      (time: number) => void  // call on every pointer move: smart queued seek
  endScrub:   () => void              // call on scrub end: resume if was playing
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

    // ── Scrub state (all refs — no re-renders needed) ─────────────────────
    const pendingTimeRef  = useRef<number | null>(null)
    const isSeekingRef    = useRef(false)
    const resumeAfterRef  = useRef(false)
    const scrubVolumeRef  = useRef(1)   // saves volume before scrub silencing

    // Kick off the next pending seek (no-op if nothing pending or already seeking)
    const flushPendingScrub = useCallback(() => {
      const v = videoRef.current
      if (!v || pendingTimeRef.current === null || isSeekingRef.current) return
      isSeekingRef.current    = true
      v.currentTime           = pendingTimeRef.current
      pendingTimeRef.current  = null
    }, [])

    // ── Expose handle ──────────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      // Tap-to-seek: jump to time, preserve current play/pause state
      seekTo: (time: number) => {
        const v = videoRef.current
        if (!v) return
        v.currentTime = time
        // Do NOT call play() here — browsers maintain play/pause state through
        // seeks automatically. Calling play() here would restart audio on a
        // video the user deliberately paused.
      },

      // Called once when the user starts dragging the scrubber
      beginScrub: () => {
        const v = videoRef.current
        if (!v) return
        resumeAfterRef.current = !v.paused
        scrubVolumeRef.current = v.volume
        // Silence via volume (never touch v.muted — that belongs to the user)
        v.volume = 0
        if (!v.paused) v.pause()
        // Do NOT call hls.stopLoad(). Stopping + restarting HLS loading causes
        // it to append new segments on top of existing SourceBuffer data,
        // creating a second overlapping audio stream. HLS.js handles mid-scrub
        // seeks correctly on its own — we just need to stay out of the way.
      },

      // Called on every pointer-move: queue the seek, let the 'seeked' event chain them
      scrub: (time: number) => {
        const v = videoRef.current
        if (!v) return
        pendingTimeRef.current = time
        flushPendingScrub()
      },

      // Called when the user releases the scrubber
      endScrub: () => {
        const v = videoRef.current
        if (!v) return
        // Do NOT call hls.startLoad() — HLS restarts loading naturally when
        // play() triggers the media element to request more data. Explicitly
        // calling startLoad() while the SourceBuffer still holds data from the
        // previous position is what causes the double-audio track.
        v.volume = scrubVolumeRef.current
        if (resumeAfterRef.current) v.play().catch(() => {})
        resumeAfterRef.current = false
      },

      togglePlay: () => {
        const v = videoRef.current
        if (!v) return
        if (v.paused) v.play().catch(() => {}); else v.pause()
      },
    }), [flushPendingScrub])

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

    // ── Event listeners ───────────────────────────────────────────────────
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const onTime     = () => onTimeUpdate?.(video.currentTime)
      const onDuration = () => onDurationChange?.(video.duration)
      const onPlay     = () => setPlaying(true)
      const onPause    = () => setPlaying(false)

      // When a seek completes, immediately process the next pending scrub position.
      // This chains seeks: decoder finishes → we seek to the latest pointer position
      // → decoder finishes → repeat. Always converges on where the user actually is.
      const onSeeked       = () => { isSeekingRef.current = false; flushPendingScrub() }
      // Keep React muted state in sync with the element — fires on any muted/volume change
      const onVolumeChange = () => setMuted(video.muted)

      video.addEventListener('timeupdate',     onTime)
      video.addEventListener('durationchange', onDuration)
      video.addEventListener('loadedmetadata', onDuration)
      video.addEventListener('play',           onPlay)
      video.addEventListener('pause',          onPause)
      video.addEventListener('seeked',         onSeeked)
      video.addEventListener('volumechange',   onVolumeChange)

      return () => {
        video.removeEventListener('timeupdate',     onTime)
        video.removeEventListener('durationchange', onDuration)
        video.removeEventListener('loadedmetadata', onDuration)
        video.removeEventListener('play',           onPlay)
        video.removeEventListener('pause',          onPause)
        video.removeEventListener('seeked',         onSeeked)
        video.removeEventListener('volumechange',   onVolumeChange)
      }
    }, [onTimeUpdate, onDurationChange, flushPendingScrub])

    // ── Space bar = play/pause ────────────────────────────────────────────
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
      // volumechange listener will sync React muted state automatically
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
              style={{
                width: 64, height: 64,
                background: 'rgba(30,30,35,0.50)',
                backdropFilter: 'saturate(200%) blur(40px)',
                WebkitBackdropFilter: 'saturate(200%) blur(40px)',
                boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              {playing ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <rect x="5" y="4" width="4" height="16" rx="1"/>
                  <rect x="15" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21"/>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* ── Bottom-right controls ── */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mute — always visible */}
          <button
            onClick={toggleMute}
            className="rounded-full flex items-center justify-center transition-all"
            title={muted ? 'Unmute' : 'Mute'}
            style={{
              width: 36, height: 36,
              background: muted ? 'rgba(239,68,68,0.75)' : 'rgba(0,0,0,0.60)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
              boxShadow: muted ? '0 0 10px rgba(239,68,68,0.5)' : '0 2px 8px rgba(0,0,0,0.4)',
              border: muted ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            )}
          </button>

          {/* Fullscreen — hover-reveal */}
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            title="Fullscreen"
            style={{
              width: 36, height: 36,
              background: 'rgba(0,0,0,0.60)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }
)

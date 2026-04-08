'use client'

import { useState, useRef, useCallback } from 'react'
import { formatTime } from '@/lib/utils'

interface ClipExportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentTime: number
  duration: number
}

/**
 * Browser-based clip export using MediaRecorder + Canvas.
 *
 * Captures a segment of the video at real-time speed from `startTime` to `endTime`,
 * draws each frame through a canvas, and records the canvas + video audio
 * into a WebM (Chrome) or MP4 (Safari) file.
 */
export function ClipExport({ videoRef, currentTime, duration }: ClipExportProps) {
  const [open, setOpen] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(30)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef(false)

  const handleOpen = useCallback(() => {
    // Default: 5s before current → 25s after current
    const s = Math.max(0, currentTime - 5)
    const e = Math.min(duration, currentTime + 25)
    setStartTime(Math.round(s))
    setEndTime(Math.round(e))
    setOpen(true)
  }, [currentTime, duration])

  async function handleExport() {
    const video = videoRef.current
    if (!video || exporting) return

    setExporting(true)
    setProgress(0)
    abortRef.current = false

    try {
      // Create offscreen canvas matching video dimensions
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')!

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4'

      const stream = canvas.captureStream(30)

      // Try to capture audio from the video element
      try {
        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaElementSource(video)
        const dest = audioCtx.createMediaStreamDestination()
        source.connect(dest)
        source.connect(audioCtx.destination) // keep audible
        for (const track of dest.stream.getAudioTracks()) {
          stream.addTrack(track)
        }
      } catch {
        // Audio capture may fail (CORS, already connected) — export video only
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 4_000_000,
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }

      const clipDuration = endTime - startTime

      // Seek to start
      video.currentTime = startTime
      await new Promise<void>((resolve) => {
        video.addEventListener('seeked', () => resolve(), { once: true })
      })

      recorder.start(100)
      video.play().catch(() => {})

      // Monitor progress until endTime
      await new Promise<void>((resolve) => {
        const check = () => {
          if (abortRef.current) { resolve(); return }
          const elapsed = video.currentTime - startTime
          setProgress(Math.min(1, elapsed / clipDuration))
          if (video.currentTime >= endTime) {
            resolve()
          } else {
            requestAnimationFrame(draw)
          }
        }
        const draw = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          check()
        }
        draw()
      })

      video.pause()
      recorder.stop()

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
      })

      if (!abortRef.current && chunks.length > 0) {
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4'
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clip_${formatTime(startTime)}-${formatTime(endTime)}.${ext}`.replace(/:/g, '')
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Clip export failed:', err)
    } finally {
      setExporting(false)
      setProgress(0)
      setOpen(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="rounded-full flex items-center justify-center glass-interactive touch-manipulation"
        title="Export clip"
        style={{
          width: 36, height: 36,
          background: 'var(--glass-bg-elevated)',
          color: 'var(--c-text2)',
          border: '0.5px solid var(--glass-border)',
          backdropFilter: 'saturate(200%) blur(40px)',
          WebkitBackdropFilter: 'saturate(200%) blur(40px)',
          boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => !exporting && setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="glass-elevated relative w-full max-w-sm rounded-2xl p-5 space-y-4"
              style={{ border: '0.5px solid var(--glass-border)' }}
            >
              <h3 className="text-sm font-bold" style={{ color: 'var(--c-text1)' }}>Export Clip</h3>

              {/* Time range */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--c-text3)' }}>Start</label>
                  <input
                    type="number"
                    min={0} max={endTime - 1}
                    value={startTime}
                    onChange={(e) => setStartTime(Number(e.target.value))}
                    disabled={exporting}
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono glass-elevated"
                    style={{ color: 'var(--c-text1)', border: '0.5px solid var(--glass-border)' }}
                  />
                  <span className="text-[10px] font-mono mt-0.5 block" style={{ color: 'var(--c-text3)' }}>
                    {formatTime(startTime)}
                  </span>
                </div>
                <span style={{ color: 'var(--c-text3)' }}>→</span>
                <div className="flex-1">
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--c-text3)' }}>End</label>
                  <input
                    type="number"
                    min={startTime + 1} max={Math.round(duration)}
                    value={endTime}
                    onChange={(e) => setEndTime(Number(e.target.value))}
                    disabled={exporting}
                    className="w-full rounded-lg px-3 py-2 text-sm font-mono glass-elevated"
                    style={{ color: 'var(--c-text1)', border: '0.5px solid var(--glass-border)' }}
                  />
                  <span className="text-[10px] font-mono mt-0.5 block" style={{ color: 'var(--c-text3)' }}>
                    {formatTime(endTime)}
                  </span>
                </div>
              </div>

              <p className="text-xs" style={{ color: 'var(--c-text3)' }}>
                Duration: {formatTime(endTime - startTime)} — exports at real-time speed
              </p>

              {/* Progress */}
              {exporting && (
                <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--c-surf2)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progress * 100}%`, background: 'var(--c-tint)' }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { abortRef.current = true; setOpen(false) }}
                  className="px-4 py-2 rounded-xl text-sm font-medium glass-interactive"
                  style={{ color: 'var(--c-text2)', border: '0.5px solid var(--glass-border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold glass-elevated glass-interactive"
                  style={{
                    color: exporting ? 'var(--c-text3)' : 'var(--c-tint)',
                    border: '0.5px solid var(--glass-border)',
                  }}
                >
                  {exporting ? `${Math.round(progress * 100)}%` : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

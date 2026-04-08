'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface VoiceDictationProps {
  onTranscript: (text: string) => void
}

export function VoiceDictation({ onTranscript }: VoiceDictationProps) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<any>(null)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-AU'

    recognition.onresult = (e: any) => {
      let final = ''
      let inter = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else inter += t
      }
      setInterim(inter)
      if (final) {
        onTranscript(final.trim())
        stop()
      }
    }

    recognition.onerror = () => stop()
    recognition.onend = () => { setListening(false); setInterim('') }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [supported, onTranscript, stop])

  // Clean up on unmount
  useEffect(() => () => { recognitionRef.current?.abort() }, [])

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={listening ? stop : start}
        className="rounded-full flex items-center justify-center glass-interactive touch-manipulation"
        title={listening ? 'Stop dictation' : 'Voice dictation'}
        style={{
          width: 36, height: 36,
          background: listening ? 'rgba(239,68,68,0.65)' : 'var(--glass-bg-elevated)',
          color: listening ? '#fff' : 'var(--c-text2)',
          border: listening ? '0.5px solid rgba(239,68,68,0.5)' : '0.5px solid var(--glass-border)',
          backdropFilter: 'saturate(200%) blur(40px)',
          WebkitBackdropFilter: 'saturate(200%) blur(40px)',
          boxShadow: listening
            ? '0 0 12px rgba(239,68,68,0.4), inset 0 0.5px 0 rgba(255,255,255,0.15)'
            : 'inset 0 0.5px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.25)',
          animation: listening ? 'tag-pulse 1.2s ease-in-out infinite' : undefined,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>

      {/* Interim transcript bubble */}
      {listening && interim && (
        <div
          className="glass-elevated rounded-xl px-3 py-1.5 text-xs max-w-[200px] truncate"
          style={{
            color: 'var(--c-text2)',
            border: '0.5px solid var(--glass-border)',
          }}
        >
          {interim}
        </div>
      )}
    </div>
  )
}

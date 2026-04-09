'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

type Tool = 'pen' | 'arrow' | 'circle' | 'rect'

interface Point { x: number; y: number }

interface Stroke {
  tool: Tool
  colour: string
  width: number
  points: Point[]   // pen: many points; arrow/circle/rect: [start, end]
}

interface TelestrationProps {
  active: boolean          // only show when video is paused
  onClose: () => void
}

const COLOURS = ['#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
const TOOLS: { key: Tool; label: string; icon: JSX.Element }[] = [
  { key: 'pen',    label: 'Draw',   icon: <PenIcon /> },
  { key: 'arrow',  label: 'Arrow',  icon: <ArrowIcon /> },
  { key: 'circle', label: 'Circle', icon: <CircleIcon /> },
  { key: 'rect',   label: 'Rect',   icon: <RectIcon /> },
]

export function Telestration({ active, onClose }: TelestrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [colour, setColour] = useState('#EF4444')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const currentStroke = useRef<Stroke | null>(null)
  const drawing = useRef(false)

  // Redraw all strokes + current in-progress stroke
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas resolution to display size
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width * 2 || canvas.height !== rect.height * 2) {
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      ctx.scale(2, 2)
    }

    ctx.clearRect(0, 0, rect.width, rect.height)

    const cur = currentStroke.current
    const all = cur ? [...strokes, cur] : strokes
    for (const s of all) {
      if (!s) continue
      ctx.strokeStyle = s.colour
      ctx.fillStyle = s.colour
      ctx.lineWidth = s.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (s.tool === 'pen') {
        drawPen(ctx, s.points)
      } else if (s.tool === 'arrow' && s.points.length >= 2) {
        drawArrow(ctx, s.points[0], s.points[s.points.length - 1], s.width)
      } else if (s.tool === 'circle' && s.points.length >= 2) {
        drawEllipse(ctx, s.points[0], s.points[s.points.length - 1])
      } else if (s.tool === 'rect' && s.points.length >= 2) {
        drawRect(ctx, s.points[0], s.points[s.points.length - 1])
      }
    }
  }, [strokes])

  useEffect(() => { redraw() }, [redraw])

  // Clear on close
  useEffect(() => {
    if (!active) { setStrokes([]); currentStroke.current = null }
  }, [active])

  function toLocal(e: React.PointerEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    // Accept pen and touch/mouse
    drawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = toLocal(e)
    // Apple Pencil uses more detail — finer stroke for pen
    const w = e.pointerType === 'pen' ? Math.max(1, strokeWidth * 0.7) : strokeWidth
    currentStroke.current = { tool, colour, width: w, points: [pt] }
    redraw()
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !currentStroke.current) return
    const pt = toLocal(e)
    if (tool === 'pen') {
      currentStroke.current.points.push(pt)
    } else {
      // For shape tools, keep start + update end
      currentStroke.current.points = [currentStroke.current.points[0], pt]
    }
    redraw()
  }

  function handlePointerUp() {
    if (!drawing.current || !currentStroke.current) return
    drawing.current = false
    setStrokes((prev) => [...prev, currentStroke.current!])
    currentStroke.current = null
  }

  function undo() {
    setStrokes((prev) => prev.slice(0, -1))
  }

  function clearAll() {
    setStrokes([])
    currentStroke.current = null
    redraw()
  }

  if (!active) return null

  return (
    <div className="absolute inset-0 z-30">
      {/* Drawing canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: 'crosshair', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Toolbar — glass pill at top */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 glass-elevated"
        style={{
          borderRadius: 16,
          border: '0.5px solid var(--glass-border)',
        }}
      >
        {/* Tools */}
        {TOOLS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className="rounded-xl p-2 transition-all glass-interactive"
            title={t.label}
            style={{
              background: tool === t.key ? 'var(--c-tint)' : 'transparent',
              color: tool === t.key ? '#fff' : 'var(--c-text2)',
            }}
          >
            {t.icon}
          </button>
        ))}

        {/* Separator */}
        <div className="h-5 w-px mx-0.5" style={{ background: 'var(--c-border)' }} />

        {/* Colours */}
        {COLOURS.map((c) => (
          <button
            key={c}
            onClick={() => setColour(c)}
            className="rounded-full transition-all"
            style={{
              width: colour === c ? 22 : 16,
              height: colour === c ? 22 : 16,
              background: c,
              boxShadow: colour === c
                ? `0 0 0 2px var(--c-bg), 0 0 0 3.5px ${c}`
                : c === '#FFFFFF' ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : undefined,
            }}
          />
        ))}

        <div className="h-5 w-px mx-0.5" style={{ background: 'var(--c-border)' }} />

        {/* Stroke width */}
        <input
          type="range"
          min={1} max={8} value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-16 accent-blue-500"
        />

        <div className="h-5 w-px mx-0.5" style={{ background: 'var(--c-border)' }} />

        {/* Undo / Clear / Done */}
        <button onClick={undo} className="rounded-xl p-2 glass-interactive" style={{ color: 'var(--c-text2)' }} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6.69 3L3 13"/></svg>
        </button>
        <button onClick={clearAll} className="rounded-xl p-2 glass-interactive" style={{ color: 'var(--c-text2)' }} title="Clear all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button
          onClick={onClose}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold glass-interactive"
          style={{ color: 'var(--c-tint)' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ── Drawing helpers ────────────────────────────────────────────────────────

function drawPen(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, from: Point, to: Point, w: number) {
  const headLen = Math.max(12, w * 5)
  const angle = Math.atan2(to.y - from.y, to.x - from.x)

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // Arrowhead
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function drawEllipse(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const cx = (from.x + to.x) / 2
  const cy = (from.y + to.y) / 2
  const rx = Math.abs(to.x - from.x) / 2
  const ry = Math.abs(to.y - from.y) / 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawRect(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  ctx.beginPath()
  ctx.rect(from.x, from.y, to.x - from.x, to.y - from.y)
  ctx.stroke()
}

// ── Tool icons ────────────────────────────────────────────────────────────

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="19" x2="19" y2="5"/>
      <polyline points="12 5 19 5 19 12"/>
    </svg>
  )
}

function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
    </svg>
  )
}

function RectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  )
}

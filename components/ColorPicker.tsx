'use client'

import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  '#000000', '#ffffff', '#e8e6e1', '#9a948b', '#b91c1c', '#1d4ed8', '#15803d', '#a16207',
  '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#0e142a', '#374151', '#facc15', '#10b981',
]

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return '#' + [(r + m) * 255, (g + m) * 255, (b + m) * 255]
    .map((u) => Math.max(0, Math.min(255, Math.round(u))).toString(16).padStart(2, '0'))
    .join('')
}

function hexToHsv(hex: string): [number, number, number] {
  let [r, g, b] = hexToRgb(hex)
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max ? d / max : 0, max]
}

export default function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(value))
  const [h, s, v] = hsv
  const wrapRef = useRef<HTMLDivElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const dragSV = useRef(false)
  const dragHue = useRef(false)

  useEffect(() => {
    if (!/^#?[0-9a-f]{6}$/i.test(value.trim())) return
    if (hsvToHex(h, s, v).toLowerCase() === ('#' + value.replace('#', '')).toLowerCase()) return
    const [nh, ns, nv] = hexToHsv(value)
    setHsv([ns === 0 ? h : nh, ns, nv])
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function emit(nh: number, ns: number, nv: number) {
    setHsv([nh, ns, nv])
    onChange(hsvToHex(nh, ns, nv))
  }

  function handleSV(e: React.PointerEvent) {
    const r = svRef.current!.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width)
    const y = Math.min(Math.max(e.clientY - r.top, 0), r.height)
    emit(h, x / r.width, 1 - y / r.height)
  }

  function handleHue(e: React.PointerEvent) {
    const r = hueRef.current!.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width)
    emit((x / r.width) * 360, s, v)
  }

  const current = /^#?[0-9a-f]{6}$/i.test(value.trim()) ? value : hsvToHex(h, s, v)

  return (
    <div className="swatch-wrap" ref={wrapRef}>
      <button
        type="button"
        className="swatch"
        aria-label="Selector de color"
        style={{ background: current }}
        onClick={() => setOpen((o) => !o)}
      />
      {open && (
        <div className="cpop">
          <div
            ref={svRef}
            className="cp-sv"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${h} 100% 50%)`,
            }}
            onPointerDown={(e) => { dragSV.current = true; e.currentTarget.setPointerCapture(e.pointerId); handleSV(e) }}
            onPointerMove={(e) => { if (dragSV.current) handleSV(e) }}
            onPointerUp={() => { dragSV.current = false }}
          >
            <span className="cp-knob" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: current }} />
          </div>

          <div
            ref={hueRef}
            className="cp-hue"
            onPointerDown={(e) => { dragHue.current = true; e.currentTarget.setPointerCapture(e.pointerId); handleHue(e) }}
            onPointerMove={(e) => { if (dragHue.current) handleHue(e) }}
            onPointerUp={() => { dragHue.current = false }}
          >
            <span className="cp-knob" style={{ left: `${(h / 360) * 100}%`, background: `hsl(${h} 100% 50%)` }} />
          </div>

          <div className="cp-presets">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className="cp-chip"
                style={{ background: c }}
                aria-label={c}
                onClick={() => { setHsv(hexToHsv(c)); onChange(c) }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

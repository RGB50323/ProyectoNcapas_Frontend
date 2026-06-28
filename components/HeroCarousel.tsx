'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export type HeroSlide = {
  id: string
  image: string
  eyebrow: string
  headline: string
  sub: string
  cta: string
  href: string
  objectPosition?: string
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => { setActive(idx) }, [])
  const next = useCallback(() => setActive((a) => (a + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setActive((a) => (a - 1 + slides.length) % slides.length), [slides.length])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!paused) timerRef.current = setInterval(next, 6000)
  }, [next, paused])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const handleNav = (fn: () => void) => { fn(); resetTimer() }

  const circleBtn: React.CSSProperties = {
    width: 36, height: 36, borderRadius: '50%',
    border: '1px solid oklch(1 0 0 / 0.4)',
    background: 'oklch(0.118 0.012 62 / 0.55)',
    color: 'var(--text)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
    fontSize: 16, lineHeight: 1,
    transition: 'background 200ms, border-color 200ms',
  }

  return (
    <section
      aria-label="Hero"
      style={{ position: 'relative', width: '100%', minHeight: 'min(calc(100dvh - 68px), 100vw * 9 / 16)', maxHeight: 'calc(100dvh - 68px)', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-0)' }}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== active}
          style={{
            position: 'absolute', inset: 0,
            opacity: i === active ? 1 : 0,
            transition: 'opacity 800ms ease-in-out',
            zIndex: i === active ? 1 : 0,
            pointerEvents: i === active ? 'auto' : 'none',
          }}
        >
          <img
            src={s.image}
            alt=""
            role="presentation"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              objectPosition: s.objectPosition ?? 'center center',
            }}
          />

          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, oklch(0.118 0.012 62 / 0.97) 0%, oklch(0.118 0.012 62 / 0.72) 38%, oklch(0.118 0.012 62 / 0.42) 62%, oklch(0.118 0.012 62 / 0.18) 82%, oklch(0.118 0.012 62 / 0.05) 100%)',
          }} />

          {/* Slide text — centered */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 40px 108px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20, textShadow: '0 1px 12px oklch(0.118 0.012 62 / 0.85)' }}>
              {s.eyebrow}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 8vw, 116px)',
              lineHeight: 0.88, fontWeight: 700,
              textTransform: 'uppercase', color: 'var(--text)',
              margin: 0, letterSpacing: '0.01em',
              whiteSpace: 'pre-line',
              textShadow: '0 2px 28px oklch(0.118 0.012 62 / 0.7), 0 1px 4px oklch(0.118 0.012 62 / 0.6)',
            }}>
              {s.headline}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.65, margin: '20px 0 32px', maxWidth: 480, textShadow: '0 1px 10px oklch(0.118 0.012 62 / 0.8)' }}>
              {s.sub}
            </p>
            <Link href={s.href} className="btn btn-lg">{s.cta} →</Link>
          </div>
        </div>
      ))}

      {/* Slide counter — top right */}
      <div style={{
        position: 'absolute', top: 28, right: 40,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)',
        letterSpacing: '0.12em', textTransform: 'uppercase', zIndex: 10,
      }}>
        {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>

      {/* Bottom control bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 40px 32px',
        display: 'flex', alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Left spacer */}
        <div style={{ flex: 1 }} />

        {/* Progress bars — center */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => handleNav(() => goTo(i))}
              aria-label={`Ir al slide ${i + 1}`}
              style={{
                position: 'relative',
                height: 3,
                width: i === active ? 40 : 28,
                background: i < active ? 'oklch(1 0 0 / 0.7)' : 'oklch(1 0 0 / 0.3)',
                border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden',
                transition: 'width 350ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {i === active && (
                <span
                  key={`fill-${active}-${paused}`}
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'oklch(1 0 0 / 0.95)',
                    width: '0%',
                    animation: paused ? 'none' : 'fillSlide 6s linear forwards',
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Controls — right */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => { setPaused((p) => !p); resetTimer() }}
            aria-label={paused ? 'Reanudar' : 'Pausar'}
            style={circleBtn}
          >
            {paused ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => handleNav(prev)}
            aria-label="Anterior"
            style={circleBtn}
          >
            ‹
          </button>
          <button
            onClick={() => handleNav(next)}
            aria-label="Siguiente"
            style={circleBtn}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

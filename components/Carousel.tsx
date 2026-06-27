'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/types'

export default function Carousel({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setActive((a) => (a + 1) % products.length), [products.length])

  useEffect(() => {
    if (products.length <= 1) return
    timerRef.current = setInterval(next, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next, products.length])

  if (products.length === 0) return null

  const p = products[active]

  return (
    <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <Link href={`/product/${p.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Link>

      <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, padding: 20, background: 'var(--bg-0)', border: '1px solid var(--border)' }}>
        <div className="mono mute">PIEZA VERIFICADA · {p.brand}</div>
        <div className="display" style={{ fontSize: 18, marginTop: 6 }}>{p.name}</div>
        <div className="mono mute" style={{ marginTop: 8 }}>SKU: {p.sku}</div>
      </div>

      {products.length > 1 && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6, zIndex: 2 }}>
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Ver pieza ${i + 1}`}
              style={{
                width: i === active ? 22 : 8, height: 8, padding: 0, border: 'none',
                background: i === active ? 'var(--text)' : 'oklch(1 0 0 / 0.5)',
                cursor: 'pointer', transition: 'width 250ms ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
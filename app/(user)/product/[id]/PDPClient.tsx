'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Product, Review } from '@/lib/types'
import { Icon } from '@/components/Icon'
import ProductCard from '@/components/ProductCard'

const REVIEW_PHOTO_PALETTE = ['#f4f1ea', '#efe9df', '#e8eaed']

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {images.map((src, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: 0, background: 'var(--card)', border: '1px solid ' + (i === active ? 'var(--accent)' : 'var(--border)'),
            aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', borderRadius: 0,
          }}>
            <img src={src} alt={`${name} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ))}
      </div>
      <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--card)' }}>
        <img src={images[active]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
          <span className="badge verified">✓ VERIFICADO</span>
          <span className="badge limited">LIMITADO</span>
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 20, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--text)', background: 'var(--bg-0)', padding: '6px 10px', border: '1px solid var(--border)' }}>
          0{active + 1} / 0{images.length}
        </div>
      </div>
    </div>
  )
}

function Variants({ product, size, setSize, color, setColor }: {
  product: Product; size: string; setSize: (s: string) => void; color: string; setColor: (c: string) => void
}) {
  const sizes = [...new Set(product.variants.map((v) => v.size))]
  const stockFor = (s: string) => product.variants.find((v) => v.size === s && v.color === color)?.stock ?? 0
  return (
    <>
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="label">Color · {color}</div>
          <div className="mono mute">GUÍA DE TALLAS →</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {product.colors.map((c) => (
            <button key={c.name} onClick={() => setColor(c.name)} title={c.name} aria-label={c.name} style={{
              width: 36, height: 36, borderRadius: 0, background: c.hex,
              border: color === c.name ? '2px solid var(--accent)' : '1px solid var(--border)',
              outline: color === c.name ? '2px solid var(--bg-0)' : 'none', outlineOffset: -4, cursor: 'pointer',
            }} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="label">Talla · {size || 'Selecciona'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {sizes.map((s) => {
            const st = stockFor(s)
            const out = st === 0
            const low = st > 0 && st <= 2
            return (
              <button key={s} onClick={() => !out && setSize(s)} disabled={out} style={{
                position: 'relative', padding: '14px 0',
                background: size === s ? 'var(--text)' : 'var(--card)',
                color: out ? 'var(--text-mute)' : size === s ? 'var(--bg-0)' : 'var(--text)',
                border: '1px solid ' + (size === s ? 'var(--text)' : 'var(--border-bright)'),
                fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em',
                cursor: out ? 'not-allowed' : 'pointer', opacity: out ? 0.5 : 1,
              }}>
                {s.replace('US ', '')}
                {out && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 10, color: 'var(--text-mute)' }}>—</span>}
                {low && <span style={{ position: 'absolute', top: 2, right: 4, width: 6, height: 6, background: 'var(--accent-2)', borderRadius: 99 }} />}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--text-dim)' }}><Icon.Dot /> Disponible</span>
          <span style={{ color: 'var(--accent-2)' }}><Icon.Dot /> Poco stock</span>
          <span style={{ color: 'var(--text-mute)' }}><Icon.Dot /> Agotado</span>
        </div>
      </div>
    </>
  )
}

export default function PDPClient({ product, reviews, similar }: { product: Product; reviews: Review[]; similar: Product[] }) {
  const [size, setSize] = useState(product.sizes[Math.min(4, product.sizes.length - 1)])
  const [color, setColor] = useState(product.colors[0].name)
  const [openDetails, setOpenDetails] = useState<Set<number>>(new Set([0]))

  const toggleDetail = (i: number) => setOpenDetails((prev) => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  const details: [string, string][] = [
    ['DESCRIPCIÓN', product.desc],
    ['MATERIALES', 'Upper: malla ingenieril + refuerzos de gamuza. Entresuela: phylon. Suela: compuesto de caucho. Plantilla: OrthoFoam.'],
    ['AUTENTICACIÓN', `Inspeccionado por el equipo de autenticación de K LAB. Serial #KL-AUTH-2026-04812. Coincidencia de material, código de fábrica y construcción verificados.`],
    ['ENVÍOS Y DEVOLUCIONES', 'Envío gratis en pedidos superiores a $250. Rastreado y asegurado. Devoluciones de 30 días en piezas sin uso.'],
  ]

  return (
    <div className="container page">
      <div className="crumbs">
        <Link href="/">Inicio</Link><span className="sep">/</span>
        <Link href="/catalog">Catálogo</Link><span className="sep">/</span>
        <em>{product.name}</em>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 64, alignItems: 'start' }}>
        <Gallery images={product.images} name={product.name} />

        <div style={{ position: 'sticky', top: 120 }}>
          <div className="mono" style={{ color: 'var(--text-mute)', letterSpacing: '0.14em' }}>{product.brand} · SKU {product.sku}</div>
          <h1 className="display" style={{ fontSize: 44, marginTop: 8, lineHeight: 0.95 }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', gap: 2, color: 'var(--accent-2)' }}>
              {[1, 2, 3, 4, 5].map((i) => <Icon.Star key={i} filled={i <= Math.round(product.rating)} />)}
            </span>
            <span className="mono" style={{ fontSize: 12 }}>{product.rating} · {product.reviews} RESEÑAS VERIFICADAS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div className="display" style={{ fontSize: 44 }}>${product.price}</div>
            <div className="mono mute">USD · IMP. INCL.</div>
            <div style={{ marginLeft: 'auto', color: product.soldOut ? 'var(--danger)' : 'var(--ok)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em' }}>
              <Icon.Dot /> {product.soldOut ? 'AGOTADO' : 'EN STOCK'}
            </div>
          </div>

          <Variants product={product} size={size} setSize={setSize} color={color} setColor={setColor} />

          <div style={{ display: 'flex', gap: 8, marginTop: 32 }}>
            <button className="btn btn-lg" style={{ flex: 1 }} disabled={product.soldOut}>Añadir a la bolsa · ${product.price}</button>
            <button className="btn btn-ghost btn-lg" title="Favorito" aria-label="Favorito" style={{ padding: '16px' }}><Icon.Heart /></button>
            <Link href="/compare" className="btn btn-ghost btn-lg" title="Comparar" aria-label="Comparar" style={{ padding: '16px' }}><Icon.Compare /></Link>
          </div>
          <button className="btn btn-outline btn-lg" style={{ width: '100%', marginTop: 10 }}>Reservar este par · 24H</button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 32, border: '1px solid var(--border)' }}>
            {[
              ['✓ Verificado por el Lab', 'Inspeccionado a mano · Cert #KL-04812'],
              ['Envío gratis $250+', 'Entregado en 3–5 días'],
              ['Devoluciones sin líos', '30 días · reembolso calificado'],
              ['Garantía de autenticidad', 'Si es falso, reembolso x2'],
            ].map(([t, s], i) => (
              <div key={t} style={{ padding: 16, borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div className="display" style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--text)' }}>{t}</div>
                <div className="mono" style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, borderTop: '1px solid var(--border)' }}>
            {details.map(([t, b], i) => (
              <div key={t} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleDetail(i)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 0', width: '100%', background: 'none', border: 'none',
                    color: 'var(--text)', textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div className="display" style={{ fontSize: 14, letterSpacing: '0.02em' }}>{t}</div>
                  <span style={{ transform: openDetails.has(i) ? 'rotate(45deg)' : 'none', transition: '180ms ease-out', display: 'flex', flexShrink: 0 }}>
                    <Icon.Plus />
                  </span>
                </button>
                {openDetails.has(i) && <div style={{ paddingBottom: 20, color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.7 }}>{b}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section" style={{ padding: '80px 0' }}>
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ RESEÑAS DE COMPRADORES VERIFICADOS</div>
            <div className="display" style={{ fontSize: 32, marginTop: 8 }}>DESDE LA ROTACIÓN</div>
          </div>
          <div className="meta">{product.reviews} RESEÑAS · {product.rating}/5.0 PROM.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="display" style={{ fontSize: 14 }}>{r.name}</div>
                <div className="mono mute">{r.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 2, color: 'var(--accent-2)', marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((j) => <Icon.Star key={j} filled={j <= r.rating} />)}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                {Array.from({ length: r.photos }).map((_, j) => (
                  <div key={j} style={{ width: 56, height: 56, background: REVIEW_PHOTO_PALETTE[j % 3], border: '1px solid var(--border)', borderRadius: 2 }} />
                ))}
              </div>
              <div className="mono mute" style={{ marginTop: 14, fontSize: 11, color: 'var(--accent-2)' }}>✓ COMPRA VERIFICADA</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="display" style={{ fontSize: 32 }}>PIEZAS SIMILARES</div>
          <div className="meta">{similar.length} RECOMENDADAS</div>
        </div>
        <div className="grid-products">
          {similar.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  )
}

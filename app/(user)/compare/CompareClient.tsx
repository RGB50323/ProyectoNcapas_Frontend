'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { Product, Category } from '@/lib/types'
import { useCompare } from '@/lib/compare'
import { Icon } from '@/components/Icon'
import ComparePickerModal from '@/components/ComparePickerModal'

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  PRE_OWNED_EXCELLENT: 'Seminuevo · Excelente',
  PRE_OWNED_GOOD: 'Seminuevo · Bueno',
  COLLECTOR_ITEM: 'Pieza de colección',
}

const MIN_SLOTS = 2

export default function CompareClient({ allProducts, categories }: { allProducts: Product[]; categories: Category[] }) {
  const compare = useCompare()
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const selected = useMemo(
    () => compare.ids.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean) as Product[],
    [compare.ids, allProducts]
  )

  const slotCount = Math.max(MIN_SLOTS, Math.min(selected.length + 1, compare.max))
  const slots: (Product | null)[] = Array.from({ length: slotCount }, (_, i) => selected[i] ?? null)

  const rows: { label: string; get: (p: Product) => string }[] = [
    { label: 'Precio', get: (p) => `$${p.price}` },
    { label: 'Marca', get: (p) => p.brand },
    { label: 'Categoría', get: (p) => catName(p.category) },
    { label: 'Condición', get: (p) => CONDITION_LABEL[p.condition] ?? p.condition },
    { label: 'Autenticación', get: (p) => (p.auth === 'AUTHENTICATED' ? '✓ Verificado' : p.auth) },
    { label: 'Tipo de drop', get: (p) => (p.privateDrop ? 'Privado' : p.limited ? 'Limitado' : 'Estándar') },
    { label: 'Stock total', get: (p) => `${p.totalStock} unidades` },
    {
      label: 'Tallas disponibles',
      get: (p) => {
        const sizes = [...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.size))]
        return sizes.length > 4 ? `${sizes.slice(0, 4).join(' / ')}…` : sizes.join(' / ') || '—'
      },
    },
    { label: 'Calificación', get: (p) => (p.reviews > 0 && p.rating != null ? `${p.rating} (${p.reviews})` : 'Sin reseñas') },
    { label: 'SKU', get: (p) => p.sku },
  ]

  const cols = `200px repeat(${slots.length}, 1fr)`
  const excludeIds = selected.map((p) => p.id)

  return (
    <div className="container page compare-page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Comparar</em></div>

      <div className="compare-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LADO A LADO · HASTA {compare.max}</div>
          <h1 className="display" style={{ fontSize: 'clamp(34px, 9vw, 56px)', marginTop: 12 }}>COMPARAR</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {selected.length > 0 && (
            <button className="btn btn-ghost" onClick={compare.clear}>Limpiar todo</button>
          )}
        </div>
      </div>

      {selected.length === 0 ? (
        <div style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ SIN PIEZAS</div>
          <div className="display" style={{ fontSize: 'clamp(26px, 8vw, 36px)', marginTop: 12 }}>NADA QUE COMPARAR TODAVÍA.</div>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 12, marginBottom: 24 }}>
            Elegí piezas desde el catálogo o agrégalas acá abajo.
          </p>
          <button className="btn" onClick={() => setPickerSlot(0)}>+ Elegir primera pieza</button>
        </div>
      ) : (
        <>
        <div className="compare-desktop" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid var(--border)' }}>
            <div style={{ padding: 24, background: 'var(--bg-1)' }} />
            {slots.map((p, i) => (
              <div key={p?.id ?? `empty-${i}`} style={{ padding: 20, borderLeft: '1px solid var(--border)' }}>
                {p ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                      <button
                        onClick={() => compare.remove(p.id)}
                        aria-label="Quitar de la comparación"
                        title="Quitar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 4 }}
                      >
                        <Icon.Close />
                      </button>
                    </div>
                    <div style={{ height: 260, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16, background: 'var(--card)' }}>
                      <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="mono mute">{p.brand}</div>
                    <div className="display" style={{ fontSize: 16, marginTop: 4 }}>{p.name}</div>
                    <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 11 }} onClick={() => setPickerSlot(i)}>
                      Cambiar pieza
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setPickerSlot(i)}
                    style={{
                      width: '100%', height: '100%', minHeight: 340, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--card)',
                      border: '1px dashed var(--border-bright)', cursor: 'pointer', color: 'var(--text-mute)',
                    }}
                  >
                    <Icon.Plus />
                    <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em' }}>ELEGIR PIEZA</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {rows.map((r, i) => (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ padding: 16, background: 'var(--bg-1)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)', display: 'flex', alignItems: 'center' }}>
                {r.label}
              </div>
              {slots.map((p, idx) => (
                <div key={p?.id ?? `empty-${idx}`} style={{ padding: 16, borderLeft: '1px solid var(--border)', fontSize: 13, display: 'flex', alignItems: 'center', color: p ? 'var(--text)' : 'var(--text-mute)' }}>
                  {p ? r.get(p) : '—'}
                </div>
              ))}
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: cols, borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
            <div style={{ padding: 16 }} />
            {slots.map((p, idx) => (
              <div key={p?.id ?? `empty-${idx}`} style={{ padding: 16, borderLeft: '1px solid var(--border)' }}>
                {p ? (
                  <Link href={`/product/${p.id}`} className="btn" style={{ width: '100%' }}>Añadir a la bolsa</Link>
                ) : (
                  <button className="btn btn-ghost" style={{ width: '100%' }} disabled>—</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          className="compare-mobile"
          style={{ '--compare-count': slots.length } as CSSProperties}
        >
          <div
            className="compare-mobile-scroll"
            role="region"
            aria-label="Comparación de piezas"
            tabIndex={0}
          >
            <div className="compare-mobile-grid" role="table" aria-colcount={slots.length + 1}>
              <div className="compare-mobile-row compare-mobile-product-row" role="row">
                <div className="compare-mobile-corner" role="columnheader">Piezas</div>
                {slots.map((p, i) => (
                  <div className="compare-mobile-card" role="columnheader" key={p?.id ?? `mobile-empty-${i}`}>
                    {p ? (
                      <>
                        <button
                          className="compare-mobile-remove"
                          onClick={() => compare.remove(p.id)}
                          aria-label={`Quitar ${p.name} de la comparación`}
                          title="Quitar"
                        >
                          <Icon.Close />
                        </button>
                        <div className="compare-mobile-image">
                          <img src={p.images[0]} alt={p.name} />
                        </div>
                        <span className="compare-mobile-brand">{p.brand}</span>
                        <strong className="compare-mobile-name">{p.name}</strong>
                        <button className="compare-mobile-change" onClick={() => setPickerSlot(i)}>
                          Cambiar
                        </button>
                      </>
                    ) : (
                      <button className="compare-mobile-empty" onClick={() => setPickerSlot(i)}>
                        <Icon.Plus />
                        <span>Elegir pieza</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {rows.map((row) => (
                <div className="compare-mobile-row" role="row" key={`mobile-${row.label}`}>
                  <div className="compare-mobile-label" role="rowheader">{row.label}</div>
                  {slots.map((p, idx) => (
                    <div
                      className={`compare-mobile-value${p ? '' : ' is-empty'}`}
                      role="cell"
                      key={p?.id ?? `mobile-${row.label}-empty-${idx}`}
                    >
                      {p ? row.get(p) : '—'}
                    </div>
                  ))}
                </div>
              ))}

              <div className="compare-mobile-row compare-mobile-action-row" role="row">
                <div className="compare-mobile-label" role="rowheader">Acción</div>
                {slots.map((p, idx) => (
                  <div className="compare-mobile-action" role="cell" key={p?.id ?? `mobile-action-empty-${idx}`}>
                    {p ? (
                      <Link href={`/product/${p.id}`} className="btn">Ver pieza</Link>
                    ) : (
                      <button className="btn btn-ghost" disabled>—</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {slots.length > 2 && (
            <p className="compare-mobile-hint">Desliza para comparar todas las piezas →</p>
          )}
        </div>
        </>
      )}

      <ComparePickerModal
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onPick={(id) => { if (pickerSlot !== null) compare.setAt(pickerSlot, id) }}
        products={allProducts}
        excludeIds={excludeIds}
      />
    </div>
  )
}
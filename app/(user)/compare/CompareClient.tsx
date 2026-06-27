'use client'

import { useMemo, useState } from 'react'
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
    { label: 'Tallas disponibles', get: (p) => [...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.size))].slice(0, 4).join(' / ') + '…' },
    { label: 'Calificación', get: (p) => `${p.rating} (${p.reviews})` },
    { label: 'SKU', get: (p) => p.sku },
  ]

  const cols = `200px repeat(${slots.length}, 1fr)`
  const excludeIds = selected.map((p) => p.id)

  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Comparar</em></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LADO A LADO · HASTA {compare.max}</div>
          <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>COMPARAR</h1>
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
          <div className="display" style={{ fontSize: 36, marginTop: 12 }}>NADA QUE COMPARAR TODAVÍA.</div>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 12, marginBottom: 24 }}>
            Elegí piezas desde el catálogo o agrégalas acá abajo.
          </p>
          <button className="btn" onClick={() => setPickerSlot(0)}>+ Elegir primera pieza</button>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
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
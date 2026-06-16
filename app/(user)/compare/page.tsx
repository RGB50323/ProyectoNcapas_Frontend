import Link from 'next/link'
import { getProducts, getCategories } from '@/lib/api'
import type { Product } from '@/lib/types'

const CONDITION_LABEL: Record<string, string> = {
  NEW: 'Nuevo',
  PRE_OWNED_EXCELLENT: 'Seminuevo · Excelente',
  PRE_OWNED_GOOD: 'Seminuevo · Bueno',
  COLLECTOR_ITEM: 'Pieza de colección',
}

export default async function ComparePage() {
  const [all, categories] = await Promise.all([getProducts(), getCategories()])
  const products = [all[0], all[1], all[3], all[12]].filter(Boolean) as Product[]
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const rows: { label: string; get: (p: Product) => string }[] = [
    { label: 'Precio', get: (p) => `$${p.price}` },
    { label: 'Marca', get: (p) => p.brand },
    { label: 'Categoría', get: (p) => catName(p.category) },
    { label: 'Condición', get: (p) => CONDITION_LABEL[p.condition] ?? p.condition },
    { label: 'Autenticación', get: (p) => (p.auth === 'AUTHENTICATED' ? '✓ Verificado' : p.auth) },    { label: 'Tipo de drop', get: (p) => (p.privateDrop ? 'Privado' : p.limited ? 'Limitado' : 'Estándar') },
    { label: 'Stock total', get: (p) => `${p.totalStock} unidades` },
    { label: 'Tallas disponibles', get: (p) => [...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.size))].slice(0, 4).join(' / ') + '…' },
    { label: 'Calificación', get: (p) => `${p.rating} (${p.reviews})` },
    { label: 'SKU', get: (p) => p.sku },
  ]

  const cols = `200px repeat(${products.length}, 1fr)`

  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Comparar</em></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LADO A LADO · HASTA 4</div>
          <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>COMPARAR</h1>
        </div>
        <Link href="/catalog" className="btn btn-ghost">+ Agregar pieza</Link>
      </div>

      <div style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: '1px solid var(--border)' }}>
          <div style={{ padding: 24, background: 'var(--bg-1)' }} />
          {products.map((p) => (
            <div key={p.id} style={{ padding: 20, borderLeft: '1px solid var(--border)' }}>
              <div style={{ height: 260, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16, background: 'var(--card)' }}>
                <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="mono mute">{p.brand}</div>
              <div className="display" style={{ fontSize: 16, marginTop: 4 }}>{p.name}</div>
            </div>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: cols, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ padding: 16, background: 'var(--bg-1)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-mute)', display: 'flex', alignItems: 'center' }}>
              {r.label}
            </div>
            {products.map((p) => (
              <div key={p.id} style={{ padding: 16, borderLeft: '1px solid var(--border)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                {r.get(p)}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: cols, borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
          <div style={{ padding: 16 }} />
          {products.map((p) => (
            <div key={p.id} style={{ padding: 16, borderLeft: '1px solid var(--border)' }}>
              <Link href={`/product/${p.id}`} className="btn" style={{ width: '100%' }}>Añadir a la bolsa</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

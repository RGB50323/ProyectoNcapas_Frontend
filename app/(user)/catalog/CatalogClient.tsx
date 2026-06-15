'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Product, Category } from '@/lib/types'
import { Icon } from '@/components/Icon'
import ProductCard from '@/components/ProductCard'

type Filters = {
  category: string[]
  brand: string[]
  size: string[]
  color: string[]
  condition: string[]
  auth: string[]
  stock: string[]
  drop: string[]
}

const EMPTY: Filters = { category: [], brand: [], size: [], color: [], condition: [], auth: [], stock: [], drop: [] }

const COLORS: [string, string][] = [
  ['Negro', '#0a0a0a'], ['Hueso', '#e8e3d6'], ['Crema', '#e9dfc8'], ['Humo', '#3a3a3e'],
  ['Rojo', '#d92626'], ['Índigo', '#1f2a3a'], ['Oliva', '#3c3d24'], ['Goma', '#9b6a3e'],
]

const CHIPS = ['TODO', 'DROP LAB', 'K-SELECT', 'VERIFICADO', 'SEMINUEVO', 'ARCHIVO', 'DROP PRIVADO']

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="label" style={{ marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function FilterCheck({ label, count, checked, onClick }: { label: string; count?: number; checked: boolean; onClick: () => void }) {
  return (
    <label onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 14, height: 14, borderRadius: 2,
          border: '1px solid ' + (checked ? 'var(--text)' : 'var(--border)'),
          background: checked ? 'var(--text)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-0)',
        }}>
          {checked && <Icon.Check />}
        </span>
        <span style={{ color: checked ? 'var(--text)' : 'var(--text-dim)' }}>{label}</span>
      </span>
      {count !== undefined && <span className="mono mute">{count}</span>}
    </label>
  )
}

export default function CatalogClient({ products, categories, brands }: { products: Product[]; categories: Category[]; brands: string[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [sort, setSort] = useState('limited')
  const [chip, setChip] = useState('TODO')

  const availableSizes = useMemo(() => {
  return Array.from(
    new Set(products.flatMap((p) => p.variants.map((v) => v.size)))
  )
}, [products])

const availableColors = useMemo(() => {
  const map = new Map<string, string>()

  products.forEach((p) => {
    p.colors.forEach((c) => map.set(c.name, c.hex))
  })

  return Array.from(map.entries())
}, [products])

  const toggle = (k: keyof Filters, v: string) => {
    setFilters((f) => {
      const cur = f[k]
      return { ...f, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] }
    })
  }

  const items = useMemo(() => {
    let arr = [...products]
    if (chip === 'DROP LAB') arr = arr.filter((p) => p.privateDrop || p.limited)
    if (chip === 'K-SELECT') arr = arr.filter((p) => p.featured)
    if (chip === 'VERIFICADO') arr = arr.filter((p) => p.auth === 'AUTHENTICATED')
    if (chip === 'SEMINUEVO' || chip === 'ARCHIVO') arr = arr.filter((p) => p.condition.startsWith('PRE_OWNED'))
    if (chip === 'DROP PRIVADO') arr = arr.filter((p) => p.privateDrop)
    if (filters.category.length) arr = arr.filter((p) => filters.category.includes(p.category))
    if (filters.brand.length) arr = arr.filter((p) => filters.brand.includes(p.brand))
    if (filters.color.length) arr = arr.filter((p) => p.colors.some((c) => filters.color.includes(c.name)))
    if (filters.condition.length) arr = arr.filter((p) => filters.condition.includes(p.condition))
    if (filters.auth.length) arr = arr.filter((p) => filters.auth.includes(p.auth))
    if (filters.drop.length) arr = arr.filter((p) => filters.drop.some((d) => (d === 'limited' && p.limited) || (d === 'privateDrop' && p.privateDrop)))
    if (filters.stock.length) arr = arr.filter((p) => filters.stock.some((s) => (s === 'soldout' && p.soldOut) || (s === 'lowstock' && !p.soldOut && p.lowStock > 0) || (s === 'instock' && !p.soldOut)))
    if (filters.size.length) {
  arr = arr.filter((p) =>
    p.variants.some((v) => filters.size.includes(v.size))
  )
}
    if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price)
    if (sort === 'newest') arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
    if (sort === 'limited') arr.sort((a, b) => (b.limited ? 1 : 0) - (a.limited ? 1 : 0))
    return arr
  }, [products, chip, sort, filters])

  return (
    <div className="container page">
      <div className="crumbs">
        <Link href="/">Inicio</Link>
        <span className="sep">/</span>
        <em>Catálogo</em>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LA BÓVEDA COMPLETA</div>
          <h1 className="display" style={{ fontSize: 64, marginTop: 12 }}>CATÁLOGO</h1>
          <p className="mute" style={{ marginTop: 8, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>
            {items.length} piezas · inventario en vivo
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="mono mute">ORDENAR POR</span>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 220 }}>
            <option value="limited">Limitados primero</option>
            <option value="newest">Más nuevos</option>
            <option value="price-asc">Precio · menor a mayor</option>
            <option value="price-desc">Precio · mayor a menor</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        {CHIPS.map((c) => (
          <button key={c} className={'tag' + (chip === c ? ' active' : '')} onClick={() => setChip(c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 0 }}>
        <aside style={{ borderRight: '1px solid var(--border)', paddingRight: 32, position: 'sticky', top: 120, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div className="display" style={{ fontSize: 20 }}>FILTROS</div>
            <button className="mono" style={{ background: 'none', border: 'none', color: 'var(--text-mute)' }} onClick={() => setFilters(EMPTY)}>LIMPIAR</button>
          </div>

          <FilterGroup title="Categoría">
            {categories.map((c) => (
              <FilterCheck key={c.id} label={c.name} count={c.count} checked={filters.category.includes(c.id)} onClick={() => toggle('category', c.id)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Marca">
            {brands.map((b) => (
              <FilterCheck key={b} label={b} checked={filters.brand.includes(b)} onClick={() => toggle('brand', b)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Talla">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {availableSizes.map((s) =>(
                <button key={s} className={'tag' + (filters.size.includes(s) ? ' active' : '')} onClick={() => toggle('size', s)} style={{ justifyContent: 'center', padding: '8px 0' }}>{s}</button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Color">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {availableColors.map(([n, hex]) => (
                <button key={n} title={n} aria-label={n} onClick={() => toggle('color', n)} style={{
                  width: 28, height: 28, borderRadius: 0, background: hex,
                  border: filters.color.includes(n) ? '2px solid var(--text)' : '1px solid var(--border)',
                  outline: filters.color.includes(n) ? '2px solid var(--bg-0)' : 'none', outlineOffset: -4, cursor: 'pointer',
                }} />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Condición">
            {[['NEW', 'Nuevo'], ['LIKE_NEW', 'Como nuevo'], ['USED', 'Usado'], ['REFURBISHED', 'Reacondicionado']].map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.condition.includes(v)} onClick={() => toggle('condition', v)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Autenticación">
            {[['VERIFIED', '✓ Verificado'], ['PENDING', 'Pendiente'], ['NOT_REQUIRED', 'No requerida']].map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.auth.includes(v)} onClick={() => toggle('auth', v)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Disponibilidad">
            {[['instock', 'En stock'], ['lowstock', 'Poco stock'], ['soldout', 'Agotado']].map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.stock.includes(v)} onClick={() => toggle('stock', v)} />
            ))}
          </FilterGroup>

          <FilterGroup title="Tipo de drop">
            {[['limited', 'Limitado'], ['privateDrop', 'Drop privado']].map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.drop.includes(v)} onClick={() => toggle('drop', v)} />
            ))}
          </FilterGroup>
        </aside>

        <div style={{ paddingLeft: 32 }}>
          <div className="grid-products">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {items.length === 0 && (
            <div style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
              <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ SIN RESULTADOS</div>
              <div className="display" style={{ fontSize: 36, marginTop: 12 }}>NADA EN EL LAB.</div>
              <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 12, marginBottom: 0 }}>
                Los filtros activos no coinciden con ninguna pieza en bóveda.
              </p>
              <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => setFilters(EMPTY)}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

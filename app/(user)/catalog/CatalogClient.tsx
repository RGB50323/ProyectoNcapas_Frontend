'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Product, Category } from '@/lib/types'
import { Icon } from '@/components/Icon'
import { Select } from '@/components/Select'
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

const CHIPS = ['TODO', 'DROP LAB', 'K-SELECT', 'VERIFICADO', 'SEMINUEVO', 'ARCHIVO', 'DROP PRIVADO']

const CONDITIONS: [string, string][] = [['NEW', 'Nuevo'], ['LIKE_NEW', 'Como nuevo'], ['USED', 'Usado'], ['REFURBISHED', 'Reacondicionado']]
const AUTHS: [string, string][] = [['VERIFIED', '✓ Verificado'], ['PENDING', 'Pendiente'], ['NOT_REQUIRED', 'No requerida']]
const STOCKS: [string, string][] = [['instock', 'En stock'], ['lowstock', 'Poco stock'], ['soldout', 'Agotado']]
const DROPS: [string, string][] = [['limited', 'Limitado'], ['privateDrop', 'Drop privado']]

function FilterGroup({ n, title, active = 0, children }: { n: number; title: string; active?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fgroup">
      <button type="button" className="fgroup-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="fgroup-name">
          <span className="fgroup-num">{String(n).padStart(2, '0')}</span>
          {title}
          {active > 0 && <span className="fgroup-badge">{active}</span>}
        </span>
        <span className="fgroup-toggle">{open ? <Icon.Minus /> : <Icon.Plus />}</span>
      </button>
      {open && <div className="fgroup-body">{children}</div>}
    </div>
  )
}

function FilterCheck({ label, count, checked, onClick }: { label: string; count?: number; checked: boolean; onClick: () => void }) {
  return (
    <button type="button" className={'fcheck' + (checked ? ' on' : '')} aria-pressed={checked} onClick={onClick}>
      <span className="fcheck-l">
        <span className="fbox">{checked && <Icon.Check />}</span>
        <span>{label}</span>
      </span>
      {count !== undefined && <span className="fcheck-n">{count}</span>}
    </button>
  )
}

export default function CatalogClient({ products, categories, brands }: { products: Product[]; categories: Category[]; brands: string[] }) {
  const initialChip = useSearchParams().get('chip') ?? 'TODO'
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [sort, setSort] = useState('limited')
  const [chip, setChip] = useState(CHIPS.includes(initialChip) ? initialChip : 'TODO')

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

  const q = (useSearchParams().get('q') ?? '').trim().toLowerCase()

  const items = useMemo(() => {
    let arr = [...products]
    if (q) arr = arr.filter((p) => `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q))
    if (chip === 'DROP LAB') arr = arr.filter((p) => p.privateDrop || p.limited)
    if (chip === 'VERIFICADO') arr = arr.filter((p) => p.auth === 'AUTHENTICATED')
    if (chip === 'SEMINUEVO' || chip === 'ARCHIVO') arr = arr.filter((p) => p.condition !== 'NEW')
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
    if (chip === 'K-SELECT') {
      arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    } else {
      if (sort === 'price-asc') arr.sort((a, b) => a.price - b.price)
      if (sort === 'price-desc') arr.sort((a, b) => b.price - a.price)
      if (sort === 'newest') arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
      if (sort === 'limited') arr.sort((a, b) => (b.limited ? 1 : 0) - (a.limited ? 1 : 0))
    }
    return arr
  }, [products, chip, sort, filters, q])

  const active = (Object.keys(filters) as (keyof Filters)[]).flatMap((k) => filters[k].map((v) => ({ k, v })))
  const pillLabel = (k: keyof Filters, v: string): string => {
    if (k === 'category') return categories.find((c) => c.id === v)?.name ?? v
    if (k === 'condition') return CONDITIONS.find((p) => p[0] === v)?.[1] ?? v
    if (k === 'auth') return (AUTHS.find((p) => p[0] === v)?.[1] ?? v).replace('✓ ', '')
    if (k === 'stock') return STOCKS.find((p) => p[0] === v)?.[1] ?? v
    if (k === 'drop') return DROPS.find((p) => p[0] === v)?.[1] ?? v
    return v
  }

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
          <Select
            value={sort}
            onChange={setSort}
            width={240}
            ariaLabel="Ordenar por"
            options={[
              { value: 'limited', label: 'Limitados primero' },
              { value: 'newest', label: 'Más nuevos' },
              { value: 'price-asc', label: 'Precio · menor a mayor' },
              { value: 'price-desc', label: 'Precio · mayor a menor' },
            ]}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        {CHIPS.map((c) => (
          <button key={c} className={'tag' + (chip === c ? ' active' : '')} onClick={() => setChip(c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '288px 1fr', gap: 40 }}>
        <aside className="filters">
          <div className="filter-bar">
            <span className="title">
              <Icon.Filter /> FILTROS
              {active.length > 0 && <span className="filter-tally">{active.length}</span>}
            </span>
            <button className="filter-clear" disabled={active.length === 0} onClick={() => setFilters(EMPTY)}>Limpiar</button>
          </div>

          {active.length > 0 && (
            <div className="filter-active">
              {active.map(({ k, v }) => (
                <button key={k + v} className="fpill" aria-label={`Quitar ${pillLabel(k, v)}`} onClick={() => toggle(k, v)}>
                  {pillLabel(k, v)}
                  <Icon.Close />
                </button>
              ))}
            </div>
          )}

          <FilterGroup n={1} title="Categoría" active={filters.category.length}>
            {categories.map((c) => (
              <FilterCheck key={c.id} label={c.name} count={c.count} checked={filters.category.includes(c.id)} onClick={() => toggle('category', c.id)} />
            ))}
          </FilterGroup>

          <FilterGroup n={2} title="Marca" active={filters.brand.length}>
            {brands.map((b) => (
              <FilterCheck key={b} label={b} checked={filters.brand.includes(b)} onClick={() => toggle('brand', b)} />
            ))}
          </FilterGroup>

          <FilterGroup n={3} title="Talla" active={filters.size.length}>
            <div className="fsizes">
              {availableSizes.map((s) =>(
                <button key={s} type="button" className={'tag' + (filters.size.includes(s) ? ' active' : '')} onClick={() => toggle('size', s)} style={{ justifyContent: 'center', padding: '8px 0' }}>{s}</button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup n={4} title="Color" active={filters.color.length}>
            <div className="fswatches">
              {availableColors.map(([n, hex]) => (
                <button key={n} type="button" title={n} aria-label={n} aria-pressed={filters.color.includes(n)}
                  className={'fswatch' + (filters.color.includes(n) ? ' on' : '')} onClick={() => toggle('color', n)} style={{ background: hex }} />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup n={5} title="Condición" active={filters.condition.length}>
            {CONDITIONS.map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.condition.includes(v)} onClick={() => toggle('condition', v)} />
            ))}
          </FilterGroup>

          <FilterGroup n={6} title="Autenticación" active={filters.auth.length}>
            {AUTHS.map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.auth.includes(v)} onClick={() => toggle('auth', v)} />
            ))}
          </FilterGroup>

          <FilterGroup n={7} title="Disponibilidad" active={filters.stock.length}>
            {STOCKS.map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.stock.includes(v)} onClick={() => toggle('stock', v)} />
            ))}
          </FilterGroup>

          <FilterGroup n={8} title="Tipo de drop" active={filters.drop.length}>
            {DROPS.map(([v, l]) => (
              <FilterCheck key={v} label={l} checked={filters.drop.includes(v)} onClick={() => toggle('drop', v)} />
            ))}
          </FilterGroup>
        </aside>

        <div>
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

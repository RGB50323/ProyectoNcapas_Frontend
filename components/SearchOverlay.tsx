'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPublicProducts } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Icon } from './Icon'

const RECENT_KEY = 'klab_recent_search'
const MAX_RECENT = 6

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (open) setRecent(loadRecent())
  }, [open])

  useEffect(() => {
    if (open && !products) getPublicProducts().then(setProducts).catch(() => setProducts([]))
  }, [open, products])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q || !products) return []
    return products.filter((p) => `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q))
  }, [q, products])

  const brands = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.brand))).slice(0, 6),
    [products],
  )

  function persist(list: string[]) {
    setRecent(list)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list))
    } catch {}
  }

  function saveRecent(term: string) {
    const t = term.trim()
    if (!t) return
    persist([t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT))
  }

  function removeRecent(term: string) {
    persist(recent.filter((r) => r !== term))
  }

  function search(term: string) {
    const t = term.trim()
    if (!t) return
    saveRecent(t)
    router.push(`/catalog?q=${encodeURIComponent(t)}`)
    setQuery('')
    onClose()
  }

  function openProduct(p: Product) {
    saveRecent(query || p.name)
    router.push(`/product/${p.id}`)
    setQuery('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="search-overlay" onMouseDown={onClose}>
      <div className="search-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="search-inner">
        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault()
            search(query)
          }}
        >
          <Icon.Search />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar piezas, marcas, SKU…"
          />
          <button type="button" className="search-close" onClick={onClose} aria-label="Cerrar búsqueda">
            <Icon.Close />
          </button>
        </form>

        <div className="search-body">
          {q ? (
            <>
              <div className="search-eyebrow">
                {matches.length > 0 ? `${matches.length} resultado${matches.length === 1 ? '' : 's'}` : 'Sin resultados'}
              </div>
              {matches.slice(0, 6).map((p) => (
                <button key={p.id} type="button" className="search-result" onClick={() => openProduct(p)}>
                  <img src={p.images[0]} alt={p.name} />
                  <div className="search-result-meta">
                    <span className="search-result-brand">{p.brand}</span>
                    <span className="search-result-name">{p.name}</span>
                  </div>
                  <span className="search-result-price">${p.price}</span>
                </button>
              ))}
              {matches.length > 6 && (
                <button type="button" className="search-all" onClick={() => search(query)}>
                  Ver los {matches.length} resultados <Icon.ArrowR />
                </button>
              )}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <div className="search-section">
                  <div className="search-eyebrow">Búsquedas recientes</div>
                  <div className="search-chips">
                    {recent.map((r) => (
                      <span key={r} className="search-chip">
                        <button type="button" onClick={() => search(r)}>{r}</button>
                        <button type="button" className="search-chip-x" aria-label="Quitar" onClick={() => removeRecent(r)}>
                          <Icon.Close />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {brands.length > 0 && (
                <div className="search-section">
                  <div className="search-eyebrow">Marcas populares</div>
                  <div className="search-chips">
                    {brands.map((b) => (
                      <button key={b} type="button" className="tag" onClick={() => search(b)}>{b}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { deleteProduct, getMyProducts } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { usePaged } from '@/hooks/usePaged'
import Pagination from '@/components/Pagination'
import { PageLoader } from '@/components/PageLoader'
import type { Product } from '@/lib/types'

export default function SellerProductsPage() {
  const { session } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const mine = await getMyProducts(session).catch(() => [] as Product[])
        if (!cancelled) setProducts(mine)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [session])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => `${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q))
  }, [products, query])

  const { page, setPage, pageItems, pageCount } = usePaged(filtered, 10, query)

  async function handleDelete() {
    if (!productToDelete || !session?.accessToken) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteProduct(productToDelete.id, session.accessToken)
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setProductToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ INVENTARIO</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>MIS PRODUCTOS</h1>
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>{products.length} PIEZA{products.length === 1 ? '' : 'S'}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Buscar nombre, SKU o marca…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 260 }}
          />
          <Link href="/seller/products/new" className="btn">+ Nueva pieza</Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>
            {products.length === 0 ? 'Aún no tenés productos. Creá tu primera pieza.' : 'Ningún producto coincide con la búsqueda.'}
          </div>
        ) : (
          <>
            <table className="table">
              <thead><tr><th>Pieza</th><th>SKU</th><th>Precio</th><th>Stock</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, border: '1px solid var(--border)', overflow: 'hidden', flex: 'none' }}>
                          <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</div>
                          <div className="mono mute">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono mute">{p.sku}</td>
                    <td className="mono">${p.price}</td>
                    <td>
                      {p.totalStock === 0
                        ? <span className="pill red">AGOTADO</span>
                        : p.lowStock > 0
                          ? <span className="pill yellow">BAJO · {p.totalStock}</span>
                          : <span className="pill green">{p.totalStock}</span>}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link href={`/seller/products/${p.id}/edit`} className="mono accent" style={{ fontSize: 11 }}>EDITAR</Link>
                      <button type="button" className="mono" onClick={() => { setProductToDelete(p); setDeleteError('') }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: 16, fontSize: 11 }}>ELIMINAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onPage={setPage} />
          </>
        )}
      </div>

      {productToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 24, borderColor: 'var(--danger)' }}>
            <div className="eyebrow" style={{ color: 'var(--danger)' }}>◆ ELIMINAR PRODUCTO</div>
            <div className="display" style={{ fontSize: 22, marginTop: 8 }}>¿Eliminar esta pieza?</div>
            <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>Se eliminará <strong>{productToDelete.name}</strong> junto con sus variantes e imágenes. No se puede deshacer.</p>
            {deleteError && <div style={{ color: 'var(--danger)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 12 }}>{deleteError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" onClick={() => { setProductToDelete(null); setDeleteError('') }} disabled={deleting}>Cancelar</button>
              <button className="btn" onClick={handleDelete} disabled={deleting} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>{deleting ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

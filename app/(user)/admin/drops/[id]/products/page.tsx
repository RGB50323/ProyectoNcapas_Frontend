'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { admin, type AdminDrop, type AdminDropProduct } from '@/lib/admin'
import { getProducts } from '@/lib/api'
import type { Product } from '@/lib/types'
import { Select } from '@/components/Select'
import { PageLoader } from '@/components/PageLoader'
import { useToast } from '@/hooks/useToast'
import { formatNaiveMono } from '@/lib/datetime'

export default function AdminDropProductsPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const { show, ToastContainer } = useToast()

  const [drop, setDrop] = useState<AdminDrop | null>(null)
  const [items, setItems] = useState<AdminDropProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const refresh = async () => {
    if (!session) return
    const [drops, dps, all] = await Promise.all([
      admin.listDrops(session),
      admin.dropProducts(session, id),
      getProducts(session),
    ])
    setDrop(drops.find((d) => d.id === id) ?? null)
    setItems(dps)
    setProducts(all)
  }

  useEffect(() => {
    if (!session) return
    setLoading(true)
    refresh().catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id])

  const attachedIds = useMemo(() => new Set(items.map((i) => i.productId)), [items])
  const available = products.filter((p) => !attachedIds.has(p.id))
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const totalStock = items.reduce((sum, i) => sum + (productById.get(i.productId)?.totalStock ?? 0), 0)
  const soldOutCount = items.filter((i) => productById.get(i.productId)?.soldOut).length

  function statusOf(p?: Product): { label: string; cls: string } {
    if (!p) return { label: '—', cls: 'gray' }
    if (p.soldOut) return { label: 'AGOTADO', cls: 'red' }
    if (p.lowStock) return { label: 'POCO STOCK', cls: 'yellow' }
    return { label: 'DISPONIBLE', cls: 'green' }
  }

  async function handleAdd() {
    if (!session || !selected) return
    setAdding(true)
    try {
      await admin.addDropProduct(session, { dropId: id, productId: selected })
      setSelected('')
      await refresh()
      show('Producto agregado al drop', 'success')
    } catch (e) {
      show(e instanceof Error ? e.message : 'No se pudo agregar el producto', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(dpId: string) {
    if (!session) return
    setRemovingId(dpId)
    try {
      await admin.removeDropProduct(session, dpId)
      await refresh()
      show('Producto quitado del drop', 'success')
    } catch (e) {
      show(e instanceof Error ? e.message : 'No se pudo quitar el producto', 'error')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <ToastContainer />

      <div style={{ marginBottom: 8 }}>
        <Link className="mono accent" style={{ fontSize: 11 }} href="/admin/drops">← VOLVER A DROPS</Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ VENTAS · DROP</div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>{drop?.title ?? 'DROP'}</h1>
        {drop && (
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>
            {formatNaiveMono(drop.dropDate)} · {drop.type === 'PRIVATE' ? 'PRIVADO' : 'PÚBLICO'} · {drop.active ? 'ACTIVO' : 'INACTIVO'}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'UNIDADES DISPONIBLES', value: totalStock },
          { label: 'PRODUCTOS ASOCIADOS', value: items.length },
          { label: 'AGOTADOS', value: soldOutCount },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>{s.label}</div>
            <div className="display" style={{ fontSize: 'clamp(24px, 6vw, 32px)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="mono mute" style={{ fontSize: 11, marginBottom: 10 }}>AGREGAR PRODUCTO AL DROP</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            value={selected}
            onChange={setSelected}
            width={360}
            ariaLabel="Producto"
            placeholder={available.length ? '— Seleccionar producto —' : 'No hay productos disponibles'}
            options={available.map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` }))}
          />
          <button className="btn" onClick={handleAdd} disabled={!selected || adding}>{adding ? 'Agregando…' : '+ Agregar'}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const p = productById.get(it.productId)
              const st = statusOf(p)
              return (
              <tr key={it.id}>
                <td>{it.productName}</td>
                <td><span className="mono">{it.productSku}</span></td>
                <td><span className="mono">{p?.totalStock ?? '—'}</span></td>
                <td><span className={`pill ${st.cls}`}>{st.label}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="mono"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    onClick={() => handleRemove(it.id)}
                    disabled={removingId === it.id}
                  >
                    {removingId === it.id ? 'QUITANDO…' : 'QUITAR'}
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>Este drop no tiene productos asociados.</div>
        )}
      </div>
    </div>
  )
}

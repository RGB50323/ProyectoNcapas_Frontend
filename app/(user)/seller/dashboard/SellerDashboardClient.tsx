'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { deleteProduct, getMyProducts } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { admin, type AdminSeller, type AdminOrder, type AdminOrderItem, type AdminCoupon } from '@/lib/admin'
import { getMySellerProfile, orderItemsBySeller, getOrder } from '@/lib/seller'
import { Stat, ChartCard, Legend, tooltipProps, axisTick, money, MONTHS, STATUS_ORDER, STATUS_FILL, STATUS_PILL } from '@/components/charts'
import type { Product } from '@/lib/types'

export default function SellerDashboardClient() {
  const router = useRouter()
  const { session } = useAuth()

  const [products, setProducts] = useState<Product[]>([])
  const [profile, setProfile] = useState<AdminSeller | null>(null)
  const [items, setItems] = useState<AdminOrderItem[]>([])
  const [ordersMap, setOrdersMap] = useState<Record<string, AdminOrder>>({})
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)

  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [prof, mine] = await Promise.all([
          getMySellerProfile(session).catch(() => null),
          getMyProducts(session).catch(() => [] as Product[]),
        ])
        if (cancelled) return
        setProfile(prof)
        setProducts(mine)
        const [its, cps] = await Promise.all([
          prof ? orderItemsBySeller(session, prof.id).catch(() => []) : Promise.resolve([]),
          admin.listCoupons(session).catch(() => []),
        ])
        if (cancelled) return
        setItems(its)
        setCoupons(cps)
        const ids = Array.from(new Set(its.map((i) => i.orderId)))
        const res = await Promise.allSettled(ids.map((id) => getOrder(session, id)))
        if (cancelled) return
        const map: Record<string, AdminOrder> = {}
        res.forEach((r) => { if (r.status === 'fulfilled') map[r.value.id] = r.value })
        setOrdersMap(map)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [session])

  const myPieces = products
  const activePieces = myPieces.filter((p) => !p.soldOut).length
  const lowStockPieces = myPieces.filter((p) => p.lowStock > 0 && !p.soldOut)
  const soldOut = myPieces.filter((p) => p.soldOut)

  const isValid = (orderId: string) => {
    const o = ordersMap[orderId]
    return !o || (o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
  }
  const validItems = items.filter((i) => isValid(i.orderId))
  const revenue = validItems.reduce((s, i) => s + i.totalPrice, 0)
  const unitsSold = validItems.reduce((s, i) => s + i.quantity, 0)

  const now = new Date()
  const buckets: { key: string; name: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: MONTHS[d.getMonth()] })
  }
  const revMap: Record<string, number> = Object.fromEntries(buckets.map((b) => [b.key, 0]))
  validItems.forEach((it) => {
    const o = ordersMap[it.orderId]
    if (!o) return
    const d = new Date(o.createdAt)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (k in revMap) revMap[k] += it.totalPrice
  })
  const monthlyData = buckets.map((b) => ({ name: b.name, ingresos: Math.round(revMap[b.key]) }))

  const myOrders = Object.values(ordersMap)
  const statusData = STATUS_ORDER
    .map((s) => ({ name: s, value: myOrders.filter((o) => o.status === s).length, fill: STATUS_FILL[s] }))
    .filter((d) => d.value > 0)

  const soldMap: Record<string, number> = {}
  validItems.forEach((i) => { soldMap[i.productName] = (soldMap[i.productName] || 0) + i.quantity })
  const topSold = Object.entries(soldMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  const invData = [
    { name: 'En stock', value: myPieces.filter((p) => !p.soldOut && p.totalStock > 3).length, fill: 'var(--ok)' },
    { name: 'Poco stock', value: lowStockPieces.length, fill: 'var(--warn)' },
    { name: 'Agotado', value: soldOut.length, fill: 'var(--danger)' },
  ].filter((d) => d.value > 0)

  const recentSales = myOrders
    .map((o) => ({ order: o, revenue: items.filter((i) => i.orderId === o.id).reduce((s, i) => s + i.totalPrice, 0) }))
    .sort((a, b) => String(b.order.createdAt).localeCompare(String(a.order.createdAt)))
    .slice(0, 6)

  const activeCoupons = coupons.filter((c) => c.active).slice(0, 4)

  async function handleDelete() {
    if (!productToDelete || !session?.accessToken) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteProduct(productToDelete.id, session.accessToken)
      setProductToDelete(null)
      router.refresh()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="card mono mute" style={{ padding: 24 }}>Cargando tienda…</div>

  if (!profile) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div className="display" style={{ fontSize: 24 }}>Aún no tenés una tienda registrada.</div>
        <Link href="/account/profile" className="btn" style={{ marginTop: 20 }}>Registrar mi tienda</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div className="eyebrow accent" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            ◇ PANEL DE TIENDA
            <span className={`pill ${profile.verified ? 'green' : 'gray'}`}>{profile.verified ? 'VERIFICADA' : 'SIN VERIFICAR'}</span>
          </div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>{profile.storeName.toUpperCase()}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/seller/products/new" className="btn">+ Nueva pieza</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Stat label="INGRESOS" value={money(revenue)} sub={`${myOrders.length} PEDIDOS`} href="/seller/dashboard" />
        <Stat label="UNIDADES VENDIDAS" value={String(unitsSold)} sub="HISTÓRICO" href="/seller/dashboard" />
        <Stat label="PIEZAS ACTIVAS" value={String(activePieces)} sub={`${myPieces.length} EN TOTAL`} href="/seller/dashboard" />
        <Stat label="INVENTARIO" value={String(myPieces.length)} sub={`${soldOut.length} AGOTADOS · ${lowStockPieces.length} POCO STOCK`} href="/seller/dashboard" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }}>
        <ChartCard title="INGRESOS · ÚLTIMOS 6 MESES" empty={revenue === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="srev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <Tooltip {...tooltipProps} formatter={(v) => [money(Number(v)), 'Ingresos']} />
              <Area type="monotone" dataKey="ingresos" stroke="var(--accent-2)" strokeWidth={2} fill="url(#srev)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="PEDIDOS POR ESTADO" empty={statusData.length === 0}>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2} stroke="none">
                {statusData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
          <Legend data={statusData} />
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <ChartCard title="MÁS VENDIDOS" empty={topSold.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSold} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...tooltipProps} formatter={(v) => [Number(v), 'Unidades']} />
              <Bar dataKey="value" fill="var(--accent-2)" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="SALUD DE INVENTARIO" empty={invData.length === 0}>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={invData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={86} paddingAngle={2} stroke="none">
                {invData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Tooltip {...tooltipProps} />
            </PieChart>
          </ResponsiveContainer>
          <Legend data={invData} />
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="display" style={{ fontSize: 16 }}>MIS PIEZAS · {myPieces.length}</div>
            {myPieces.length > 5 && (
              <Link href="/seller/products" className="mono accent" style={{ fontSize: 11 }}>VER TODOS →</Link>
            )}
          </div>
          {myPieces.length === 0 ? (
            <div className="mono mute" style={{ padding: 28, fontSize: 13 }}>Aún no tenés productos. Creá tu primera pieza.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Pieza</th><th>SKU</th><th>Precio</th><th>Stock</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
              <tbody>
                {myPieces.slice(0, 5).map((p) => (
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
                      <button type="button" className="mono" onClick={() => setProductToDelete(p)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: 16, fontSize: 11 }}>ELIMINAR</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="display" style={{ fontSize: 16 }}>VENTAS RECIENTES</div>
          </div>
          {recentSales.length === 0 ? (
            <div className="mono mute" style={{ padding: 28, fontSize: 13 }}>Aún no hay ventas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentSales.map(({ order, revenue }) => (
                <div key={order.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="display" style={{ fontSize: 13 }}>{order.id.slice(0, 8).toUpperCase()}</div>
                    <div className="mono mute" style={{ fontSize: 11 }}>{String(order.createdAt).slice(0, 10)}</div>
                  </div>
                  <span className={`pill ${STATUS_PILL[order.status] ?? 'gray'}`}>{order.status}</span>
                  <div className="mono">{money(revenue)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>◆ ALERTAS DE STOCK</div>
          <div className="display" style={{ fontSize: 18, marginTop: 6, marginBottom: 16 }}>REPONER PRONTO</div>
          {[...soldOut, ...lowStockPieces].length === 0 ? (
            <div className="mono mute" style={{ fontSize: 13 }}>Todo el inventario en orden.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...soldOut, ...lowStockPieces].map((p) => (
                <div key={p.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="mono" style={{ color: p.soldOut ? 'var(--danger)' : 'var(--accent-2)' }}>{p.soldOut ? 'AGOTADO' : `${p.totalStock} QUEDAN`}</span>
                    <Link href={`/seller/products/${p.id}/edit?mode=stock`} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Reponer</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow accent">◇ PROMOCIONES</div>
          <div className="display" style={{ fontSize: 18, marginTop: 6, marginBottom: 16 }}>CUPONES ACTIVOS</div>
          {activeCoupons.length === 0 ? (
            <div className="mono mute" style={{ fontSize: 13 }}>No hay cupones activos.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeCoupons.map((c) => (
                <div key={c.id} style={{ padding: 12, border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div className="display" style={{ fontSize: 14 }}>{c.code}</div>
                    <div className="mono mute" style={{ marginTop: 2 }}>{c.label}</div>
                  </div>
                  <span className="mono mute">{c.usesCount}{c.maxUses ? `/${c.maxUses}` : ''} usos</span>
                </div>
              ))}
            </div>
          )}
        </div>
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

    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { useAuth } from '@/lib/auth'
import { admin, type AdminOrder, type AdminOrderItem, type AdminSeller, type AdminCoupon, type AdminDrop, type AdminCategory } from '@/lib/admin'
import { getProducts } from '@/lib/api'
import { Select } from '@/components/Select'
import type { Product } from '@/lib/types'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
const STATUS_FILL: Record<string, string> = {
  PENDING: 'var(--warn)', CONFIRMED: 'var(--info)', SHIPPED: 'var(--accent-2)',
  DELIVERED: 'var(--ok)', CANCELLED: 'var(--danger)', REFUNDED: 'var(--text-mute)',
}
const STATUS_PILL: Record<string, string> = {
  PENDING: 'yellow', CONFIRMED: 'blue', SHIPPED: 'blue', DELIVERED: 'green', CANCELLED: 'red', REFUNDED: 'gray',
}
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const shortDate = (s: string) => String(s).replace('T', ' ').slice(0, 16)

const tooltipProps = {
  contentStyle: { background: 'var(--elev)', border: '1px solid var(--border-bright)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 12 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--text-dim)' },
  cursor: { fill: 'oklch(0.212 0.016 62 / 0.4)' },
}
const axisTick = { fill: 'var(--text-mute)', fontSize: 11, fontFamily: 'var(--font-mono)' }

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="card" style={{ padding: 24, textDecoration: 'none', display: 'block' }}>
      <div className="label" style={{ marginBottom: 12 }}>{label}</div>
      <div className="display" style={{ fontSize: 34, lineHeight: 1 }}>{value}</div>
      {sub && <div className="mono" style={{ marginTop: 10, fontSize: 11, color: 'var(--accent-2)' }}>{sub}</div>}
    </Link>
  )
}

function ChartCard({ title, action, empty, children }: { title: string; action?: React.ReactNode; empty?: boolean; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="display" style={{ fontSize: 15 }}>{title}</div>
        {action}
      </div>
      <div style={{ padding: 16, flex: 1, minHeight: 260 }}>
        {empty ? <div className="mono mute" style={{ padding: '70px 0', textAlign: 'center', fontSize: 13 }}>Sin datos aún.</div> : children}
      </div>
    </div>
  )
}

function Legend({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 12, justifyContent: 'center' }}>
      {data.map((d) => (
        <span key={d.name} className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, background: d.fill, display: 'inline-block' }} /> {d.name} · {d.value}
        </span>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [drops, setDrops] = useState<AdminDrop[]>([])
  const [usersCount, setUsersCount] = useState(0)
  const [store, setStore] = useState('')
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, AdminOrderItem[]>>({})
  const [itemsLoaded, setItemsLoaded] = useState(false)

  useEffect(() => {
    if (!session) return
    Promise.allSettled([
      admin.listOrders(session), admin.listSellers(session), getProducts(),
      admin.listCategories(session), admin.listCoupons(session), admin.listDrops(session), admin.listUsers(session),
    ]).then(([o, s, p, c, co, d, u]) => {
      if (o.status === 'fulfilled') setOrders(o.value)
      if (s.status === 'fulfilled') setSellers(s.value)
      if (p.status === 'fulfilled') setProducts(p.value)
      if (c.status === 'fulfilled') setCategories(c.value)
      if (co.status === 'fulfilled') setCoupons(co.value)
      if (d.status === 'fulfilled') setDrops(d.value)
      if (u.status === 'fulfilled') setUsersCount(u.value.length)
    })
  }, [session])

  useEffect(() => {
    if (!session || !store || itemsLoaded || orders.length === 0) return
    Promise.allSettled(orders.map((o) => admin.orderItems(session, o.id))).then((res) => {
      const map: Record<string, AdminOrderItem[]> = {}
      res.forEach((r, i) => { if (r.status === 'fulfilled') map[orders[i].id] = r.value })
      setItemsByOrder(map)
      setItemsLoaded(true)
    })
  }, [session, store, itemsLoaded, orders])

  const selectedStore = sellers.find((s) => s.id === store) ?? null
  const itemsFor = (o: AdminOrder) => itemsByOrder[o.id] ?? []
  const orderInStore = (o: AdminOrder) => !store || itemsFor(o).some((it) => it.sellerId === store)
  const revOf = (o: AdminOrder) => store ? itemsFor(o).filter((it) => it.sellerId === store).reduce((s, it) => s + it.totalPrice, 0) : o.total

  const scopedOrders = orders.filter(orderInStore)
  const scopedProducts = store ? products.filter((p) => p.sellerId === store) : products

  const valid = scopedOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
  const revenue = valid.reduce((s, o) => s + revOf(o), 0)
  const openOrders = scopedOrders.filter((o) => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(o.status))
  const recentOrders = [...scopedOrders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 6)

  const soldOut = scopedProducts.filter((p) => p.soldOut)
  const low = scopedProducts.filter((p) => !p.soldOut && p.totalStock > 0 && p.totalStock <= 3)
  const inStock = scopedProducts.filter((p) => !p.soldOut && p.totalStock > 3)
  const unverified = sellers.filter((s) => !s.verified).length

  // Ingresos por mes (últimos 6)
  const now = new Date()
  const buckets: { key: string; name: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: MONTHS[d.getMonth()] })
  }
  const revMap: Record<string, number> = Object.fromEntries(buckets.map((b) => [b.key, 0]))
  valid.forEach((o) => {
    const d = new Date(o.createdAt)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    if (k in revMap) revMap[k] += revOf(o)
  })
  const monthlyData = buckets.map((b) => ({ name: b.name, ingresos: Math.round(revMap[b.key]) }))

  const statusData = STATUS_ORDER
    .map((s) => ({ name: s, value: scopedOrders.filter((o) => o.status === s).length, fill: STATUS_FILL[s] }))
    .filter((d) => d.value > 0)

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id
  const catMap: Record<string, number> = {}
  scopedProducts.forEach((p) => { const n = catName(p.category); catMap[n] = (catMap[n] || 0) + 1 })
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  const invData = [
    { name: 'En stock', value: inStock.length, fill: 'var(--ok)' },
    { name: 'Poco stock', value: low.length, fill: 'var(--warn)' },
    { name: 'Agotado', value: soldOut.length, fill: 'var(--danger)' },
  ].filter((d) => d.value > 0)

  const sellerData = [...sellers].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5).map((s) => ({ name: s.storeName, value: s.totalSales }))

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ RESUMEN ADMIN</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>{selectedStore ? selectedStore.storeName.toUpperCase() : 'RESUMEN GENERAL'}</h1>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Tienda</div>
          <Select
            value={store}
            onChange={setStore}
            width={240}
            ariaLabel="Filtrar por tienda"
            options={[{ value: '', label: 'Todas las tiendas' }, ...sellers.map((s) => ({ value: s.id, label: s.storeName }))]}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Stat label="INGRESOS" value={money(revenue)} sub={`${scopedOrders.length} PEDIDOS`} href="/admin/orders" />
        <Stat label="PEDIDOS ABIERTOS" value={String(openOrders.length)} sub="POR PROCESAR / EN CAMINO" href="/admin/orders" />
        {selectedStore ? (
          <Stat label="VENTAS TIENDA" value={String(selectedStore.totalSales)} sub={selectedStore.verified ? 'VERIFICADA' : 'SIN VERIFICAR'} href="/admin/sellers" />
        ) : (
          <Stat label="USUARIOS" value={String(usersCount)} sub={`${sellers.length} TIENDAS`} href="/admin/users" />
        )}
        <Stat label="INVENTARIO" value={String(scopedProducts.length)} sub={`${soldOut.length} AGOTADOS · ${low.length} POCO STOCK`} href="/admin/products" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }}>
        <ChartCard title="INGRESOS · ÚLTIMOS 6 MESES" empty={revenue === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--accent-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
              <Tooltip {...tooltipProps} formatter={(v) => [money(Number(v)), 'Ingresos']} />
              <Area type="monotone" dataKey="ingresos" stroke="var(--accent-2)" strokeWidth={2} fill="url(#rev)" />
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
        <ChartCard title="PRODUCTOS POR CATEGORÍA" empty={categoryData.length === 0} action={<Link href="/admin/products" className="mono accent" style={{ fontSize: 11 }}>VER →</Link>}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={110} />
              <Tooltip {...tooltipProps} formatter={(v) => [Number(v), 'Productos']} />
              <Bar dataKey="value" fill="var(--accent-2)" barSize={18} radius={[0, 0, 0, 0]} />
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

      <div style={{ display: 'grid', gridTemplateColumns: store ? '1fr' : '1.6fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="display" style={{ fontSize: 15 }}>PEDIDOS RECIENTES</div>
            <Link href="/admin/orders" className="mono accent" style={{ fontSize: 11 }}>VER TODOS →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="mono mute" style={{ padding: 28, fontSize: 13 }}>Aún no hay pedidos.</div>
          ) : (
            <table className="table">
              <thead><tr><th>Cliente</th><th>Fecha</th><th>Estado</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.customerFullName}</td>
                    <td className="mono mute">{shortDate(o.createdAt)}</td>
                    <td><span className={`pill ${STATUS_PILL[o.status] ?? 'gray'}`}>{o.status}</span></td>
                    <td className="mono" style={{ textAlign: 'right' }}>{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!store && (
          <ChartCard title="TOP TIENDAS · VENTAS" empty={sellerData.every((s) => s.value === 0)} action={<Link href="/admin/sellers" className="mono accent" style={{ fontSize: 11 }}>VER →{unverified > 0 ? ` · ${unverified} S/V` : ''}</Link>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sellerData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltipProps} formatter={(v) => [Number(v), 'Ventas']} />
                <Bar dataKey="value" fill="var(--accent-2)" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </>
  )
}

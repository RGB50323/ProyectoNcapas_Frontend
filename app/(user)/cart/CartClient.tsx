'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product, ShippingMethod, Coupon, CartLine } from '@/lib/types'
import { applyCoupon } from '@/lib/discounts'
import { Icon } from '@/components/Icon'
import { Qty, Line } from '@/components/ui'

const FREE_SHIPPING_THRESHOLD = 250

function seed(products: Product[]): CartLine[] {
  const byId = (id: string) => products.find((p) => p.id === id)!
  return [
    { product: byId('p01'), qty: 1, size: 'US 9', color: 'Ónix' },
    { product: byId('p06'), qty: 2, size: 'M', color: 'Hueso' },
    { product: byId('p08'), qty: 1, size: 'Talla única', color: 'Negro' },
  ].filter((l) => l.product)
}

export default function CartClient({ products, shipping, coupons }: { products: Product[]; shipping: ShippingMethod[]; coupons: Coupon[] }) {
  const router = useRouter()
  const [items, setItems] = useState<CartLine[]>(() => seed(products))
  const [code, setCode] = useState('KLAB10')
  const [applied, setApplied] = useState<Coupon | null>(() => coupons.find((c) => c.code === 'KLAB10') ?? null)
  const [error, setError] = useState('')
  const [ship, setShip] = useState('express')

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.product.price * i.qty, 0), [items])
  const result = useMemo(() => applyCoupon({ lines: items, subtotal }, applied), [items, subtotal, applied])
  const selected = shipping.find((s) => s.id === ship)!
  const shipFee = result.freeShipping ? 0 : selected.fee
  const total = subtotal - result.discountAmount + shipFee

  const setQty = (idx: number, q: number) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, qty: q } : x)))
  const remove = (idx: number) => setItems((arr) => arr.filter((_, i) => i !== idx))

  const applyCode = () => {
    const found = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active)
    if (found) { setApplied(found); setError('') }
    else { setApplied(null); setError('Cupón no válido o inactivo.') }
  }

  const missingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Bolsa</em></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ TU BOLSA DEL LAB</div>
          <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>BOLSA <span style={{ color: 'var(--text-mute)' }}>/ {items.length} PIEZAS</span></h1>
        </div>
        <button className="mono" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.12em' }} onClick={() => setItems([])}>VACIAR BOLSA</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
        <div>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 20, padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: idx === items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ aspectRatio: '4/5', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                <img src={it.product.images[0]} alt={it.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div className="mono mute" style={{ letterSpacing: '0.14em' }}>{it.product.brand} · SKU {it.product.sku}</div>
                <div className="display" style={{ fontSize: 20, marginTop: 4 }}>{it.product.name}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  <div className="mono" style={{ fontSize: 12 }}><span style={{ color: 'var(--text-mute)' }}>TALLA</span> {it.size}</div>
                  <div className="mono" style={{ fontSize: 12 }}><span style={{ color: 'var(--text-mute)' }}>COLOR</span> {it.color}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'center' }}>
                  <span className="badge verified">✓ VERIFICADO</span>
                  <span className="mono" style={{ color: 'var(--ok)', fontSize: 12 }}><Icon.Dot /> EN STOCK · Envía en 24h</span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                  <button className="mono mute" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Guardar para después</button>
                  <button className="mono" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--danger)' }} onClick={() => remove(idx)}>Quitar</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div className="display" style={{ fontSize: 22 }}>${it.product.price * it.qty}</div>
                <Qty value={it.qty} onChange={(q) => setQty(idx, q)} />
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center', marginTop: 24 }}>
              <div className="display" style={{ fontSize: 24 }}>Tu bolsa está vacía.</div>
              <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo <Icon.ArrowR /></Link>
            </div>
          )}

          {items.length > 0 && (
            <div style={{ marginTop: 32, padding: 24, background: 'var(--card)', border: '1px dashed var(--border-bright)', borderRadius: 4 }}>
              <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 8 }}>◇ DESDE EL LAB</div>
              <div className="display" style={{ fontSize: 18 }}>
                {missingForFree > 0
                  ? <>Agrega ${missingForFree} más para desbloquear <span style={{ color: 'var(--accent-2)' }}>envío gratis</span>.</>
                  : <>¡Tienes <span style={{ color: 'var(--accent-2)' }}>envío gratis</span> desbloqueado!</>}
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 0, marginTop: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`, background: 'var(--text)', transition: '300ms ease-out' }} />
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 120 }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 24 }}>RESUMEN DEL PEDIDO</div>

            <div className="label">Código de cupón</div>
            <div style={{ display: 'flex', gap: 0, marginBottom: error ? 8 : 20 }}>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <button className="btn btn-ghost" onClick={applyCode} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>Aplicar</button>
            </div>
            {error && <div className="mono" style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 12 }}>{error}</div>}
            {applied && (
              <div style={{ padding: '10px 12px', background: 'var(--elev)', border: '1px solid var(--border-bright)', borderRadius: 0, marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span><Icon.Check /> <strong style={{ marginLeft: 8 }}>{applied.code}</strong> · {applied.label}</span>
                <button onClick={() => setApplied(null)} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer' }} aria-label="Quitar cupón"><Icon.Close /></button>
              </div>
            )}

            <div className="label">Método de envío</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {shipping.map((s) => (
                <button key={s.id} onClick={() => setShip(s.id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
                  background: ship === s.id ? 'var(--elev)' : 'var(--bg-0)',
                  border: '1px solid ' + (ship === s.id ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 2, cursor: 'pointer', color: 'var(--text)',
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)' }}>{s.name}</div>
                    <div className="mono mute" style={{ marginTop: 4 }}>{s.eta}</div>
                  </div>
                  <div className="display" style={{ fontSize: 14 }}>{s.fee === 0 ? 'GRATIS' : `$${s.fee}`}</div>
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <Line label="Subtotal" value={`$${subtotal}`} />
              {result.discountAmount > 0 && <Line label={`Descuento (${applied?.code})`} value={`-$${result.discountAmount}`} accent />}
              <Line label="Envío" value={shipFee === 0 ? 'GRATIS' : `$${shipFee}`} />
              <Line label="Impuesto estimado" value="incl." />
              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="display" style={{ fontSize: 16 }}>TOTAL</span>
                <span className="display" style={{ fontSize: 32 }}>${total}</span>
              </div>
            </div>

            <button className="btn btn-lg" style={{ width: '100%', marginTop: 24 }} disabled={items.length === 0} onClick={() => router.push('/checkout')}>
              Pagar de forma segura <Icon.ArrowR />
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <div className="mono mute" style={{ fontSize: 11 }}>✓ PAGO CIFRADO · TARJETA · TRANSFERENCIA · CONTRA ENTREGA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

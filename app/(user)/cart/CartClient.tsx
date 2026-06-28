'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product, CouponPreview } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { previewCoupon } from '@/lib/shop'
import { Icon } from '@/components/Icon'
import { Qty, Line } from '@/components/ui'

export default function CartClient({ products }: { products: Product[] }) {
  const router = useRouter()
  const { session } = useAuth()
  const { items, update, remove, coupon, setCoupon } = useCart()

  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<CouponPreview | null>(null)
  const [error, setError] = useState('')

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const subtotal = useMemo(() => items.reduce((s, it) => s + it.lineTotal, 0), [items])

  const discount = preview ? preview.discountAmount : 0
  const total = subtotal - discount

  const runPreview = async (couponCode: string) => {
    if (!session) { setError('Inicia sesión como comprador para usar cupones.'); return }
    try {
      const result = await previewCoupon(session, { code: couponCode })
      setPreview(result)
      setCoupon(couponCode)
      setError('')
    } catch (e) {
      setPreview(null)
      setCoupon(null)
      setError(e instanceof Error ? e.message : 'Cupón no válido.')
    }
  }

  useEffect(() => {
    if (coupon) runPreview(coupon)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, coupon])

  const applyCode = () => {
    const trimmed = code.trim()
    if (trimmed) runPreview(trimmed)
  }

  const clearCoupon = () => {
    setPreview(null)
    setCoupon(null)
    setError('')
  }

  const emptyBag = async () => {
    for (const it of items) await remove(it.id)
    clearCoupon()
  }

  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Bolsa</em></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ TU BOLSA DEL LAB</div>
          <h1 className="display" style={{ fontSize: 56, marginTop: 12 }}>BOLSA <span style={{ color: 'var(--text-mute)' }}>/ {items.length} PIEZAS</span></h1>
        </div>
        {items.length > 0 && (
          <button className="mono" style={{ background: 'none', border: 'none', color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer' }} onClick={emptyBag}>VACIAR BOLSA</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
        <div>
          {items.map((it) => {
            const product = productById.get(it.productId)
            return (
              <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 20, padding: '24px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ aspectRatio: '4/5', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                  {product && <img src={product.images[0]} alt={it.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div className="mono mute" style={{ letterSpacing: '0.14em' }}>SKU {it.productSku}</div>
                  <div className="display" style={{ fontSize: 20, marginTop: 4 }}>{it.productName}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    <div className="mono" style={{ fontSize: 12 }}><span style={{ color: 'var(--text-mute)' }}>TALLA</span> {it.variantSize}</div>
                    <div className="mono" style={{ fontSize: 12 }}><span style={{ color: 'var(--text-mute)' }}>COLOR</span> {it.variantColorName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    <button className="mono" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--danger)' }} onClick={() => remove(it.id)}>Quitar</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div className="display" style={{ fontSize: 22 }}>${it.lineTotal}</div>
                  <Qty value={it.quantity} onChange={(q) => update(it.id, q)} />
                </div>
              </div>
            )
          })}

          {items.length === 0 && (
            <div className="card" style={{ padding: 48, textAlign: 'center', marginTop: 24 }}>
              <div className="display" style={{ fontSize: 24 }}>Tu bolsa está vacía.</div>
              <Link href="/catalog" className="btn" style={{ marginTop: 16 }}>Explorar el catálogo <Icon.ArrowR /></Link>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 120 }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 24 }}>RESUMEN DEL PEDIDO</div>

            <div className="label">Código de cupón</div>
            <div style={{ display: 'flex', gap: 0, marginBottom: error ? 8 : 20 }}>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Escribe tu cupón" style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              <button className="btn btn-ghost" onClick={applyCode} disabled={items.length === 0} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>Aplicar</button>
            </div>
            {error && <div className="mono" style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 12 }}>{error}</div>}
            {preview && (
              <div style={{ padding: '10px 12px', background: 'var(--elev)', border: '1px solid var(--border-bright)', borderRadius: 0, marginBottom: 20, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span><Icon.Check /> <strong style={{ marginLeft: 8 }}>{preview.couponCode}</strong></span>
                <button onClick={clearCoupon} style={{ background: 'none', border: 'none', color: 'var(--text-mute)', cursor: 'pointer' }} aria-label="Quitar cupón"><Icon.Close /></button>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <Line label="Subtotal" value={`$${subtotal}`} />
              {discount > 0 && <Line label="Descuento Cupon" value={`-$${discount}`} accent />}
              <Line label="Envío" value="Se calcula en el checkout" />
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

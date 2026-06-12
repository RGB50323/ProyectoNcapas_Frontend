'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Product, ShippingMethod, CartLine } from '@/lib/types'
import { PAYMENT_METHODS } from '@/lib/payments'
import { Icon } from '@/components/Icon'
import { Section, Field, Grid2, ReviewRow, Line } from '@/components/ui'

const STEPS = ['Datos', 'Dirección', 'Envío', 'Pago', 'Revisión', 'Listo']

function seed(products: Product[]): CartLine[] {
  const byId = (id: string) => products.find((p) => p.id === id)!
  return [
    { product: byId('p01'), qty: 1, size: 'US 9', color: 'Ónix' },
    { product: byId('p06'), qty: 2, size: 'M', color: 'Hueso' },
    { product: byId('p08'), qty: 1, size: 'Talla única', color: 'Negro' },
  ].filter((l) => l.product)
}

function PaymentPicker() {
  const [m, setM] = useState(PAYMENT_METHODS[0].id)
  const method = PAYMENT_METHODS.find((x) => x.id === m) ?? PAYMENT_METHODS[0]
  const Form = method.Form
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PAYMENT_METHODS.length}, 1fr)`, gap: 8, marginBottom: 24 }}>
        {PAYMENT_METHODS.map((x) => (
          <button key={x.id} onClick={() => setM(x.id)} style={{
            padding: 16,
            background: m === x.id ? 'var(--elev)' : 'var(--card)',
            border: '1px solid ' + (m === x.id ? 'var(--accent)' : 'var(--border)'),
            borderRadius: 0, textAlign: 'left', color: 'var(--text)', cursor: 'pointer',
          }}>
            <div className="display" style={{ fontSize: 14 }}>{x.label}</div>
            <div className="mono mute" style={{ marginTop: 4, fontSize: 11 }}>{x.desc}</div>
          </button>
        ))}
      </div>
      <Form />
    </>
  )
}

function CheckoutForm({ step, setStep, total, shipping }: { step: number; setStep: (n: number) => void; total: number; shipping: ShippingMethod[] }) {
  const express = shipping.find((s) => s.id === 'express') ?? shipping[0]
  return (
    <div>
      {step === 1 && (
        <Section title="Datos personales" eyebrow="◇ PASO 01">
          <Grid2><Field label="Nombre" value="Mario" /><Field label="Apellido" value="Sandoval" /></Grid2>
          <Field label="Correo" value="mario@klab.studio" />
          <Field label="Teléfono" value="+503 7842 1188" />
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, color: 'var(--text-dim)' }}>
            <span style={{ width: 14, height: 14, border: '1px solid var(--text)', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-0)' }}><Icon.Check /></span>
            <span style={{ fontSize: 13 }}>Avísame sobre reposiciones de esta pieza</span>
          </label>
        </Section>
      )}
      {step === 2 && (
        <Section title="Dirección de envío" eyebrow="◇ PASO 02">
          <Field label="Dirección" value="Calle La Reforma 4012, Edificio Vortex" />
          <Grid2><Field label="Ciudad" value="San Salvador" /><Field label="Código postal" value="01101" /></Grid2>
          <Grid2><Field label="País" value="El Salvador" /><Field label="Departamento" value="San Salvador" /></Grid2>
        </Section>
      )}
      {step === 3 && (
        <Section title="Método de envío" eyebrow="◇ PASO 03">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shipping.map((s) => (
              <div key={s.id} style={{
                padding: 20, border: '1px solid ' + (s.id === 'express' ? 'var(--accent)' : 'var(--border)'),
                background: s.id === 'express' ? 'var(--elev)' : 'var(--card)', borderRadius: 0,
                display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 16, alignItems: 'center', cursor: 'pointer',
              }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, border: '1px solid ' + (s.id === 'express' ? 'var(--accent)' : 'var(--border-bright)'), background: s.id === 'express' ? 'radial-gradient(circle, var(--accent) 0 4px, transparent 5px)' : 'transparent' }} />
                <div>
                  <div className="display" style={{ fontSize: 16 }}>{s.name}</div>
                  <div className="mono mute" style={{ marginTop: 4 }}>{s.eta}</div>
                </div>
                <div className="display" style={{ fontSize: 18 }}>{s.fee === 0 ? 'GRATIS' : `$${s.fee}`}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {step === 4 && (
        <Section title="Método de pago" eyebrow="◇ PASO 04">
          <PaymentPicker />
        </Section>
      )}
      {step === 5 && (
        <Section title="Revisa tu pedido" eyebrow="◇ PASO 05">
          <ReviewRow label="Contacto" value="mario@klab.studio · +503 7842 1188" />
          <ReviewRow label="Enviar a" value="Calle La Reforma 4012, San Salvador, El Salvador 01101" />
          <ReviewRow label="Método" value={`${express.name} · ${express.eta}`} />
          <ReviewRow label="Pago" value="•••• 4242 · VISA · Mario Sandoval" />
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 24, color: 'var(--text-dim)' }}>
            <span style={{ width: 14, height: 14, border: '1px solid var(--text)', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-0)', flexShrink: 0, marginTop: 3 }}><Icon.Check /></span>
            <span style={{ fontSize: 12, lineHeight: 1.6 }}>Confirmo que todas las piezas de este pedido han sido verificadas por el equipo de autenticación de K LAB. Acepto los <a style={{ textDecoration: 'underline' }}>Términos de venta</a> y la <a style={{ textDecoration: 'underline' }}>Política de devoluciones</a>.</span>
          </label>
        </Section>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button className="btn btn-ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>← Atrás</button>
        {step < 5 && <button className="btn" onClick={() => setStep(step + 1)}>Continuar → Paso {step + 1}</button>}
        {step === 5 && <button className="btn btn-lg" onClick={() => setStep(6)}>Confirmar y pagar ${total} <Icon.ArrowR /></button>}
      </div>
    </div>
  )
}

function CheckoutDone() {
  return (
    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
      <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 16 }}>◆ PEDIDO CONFIRMADO · KL-24201</div>
      <h2 className="display" style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>TU PIEZA<br />HA SIDO <span style={{ color: 'var(--accent-2)' }}>ASEGURADA.</span></h2>
      <p className="mute" style={{ maxWidth: 440, margin: '16px auto 32px', lineHeight: 1.7 }}>
        Pedido KL-24201 registrado. El equipo de autenticación de K LAB inspeccionará y despachará tus piezas. Recibirás una guía de rastreo cuando salga del laboratorio.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link href="/account" className="btn">Rastrear mi pedido <Icon.ArrowR /></Link>
        <Link href="/" className="btn btn-ghost">Volver al Lab</Link>
      </div>
      <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'left' }}>
        {[
          ['GUÍA DE RASTREO', 'DHL-882-114-201'],
          ['FACTURA', 'KL-INV-2026-04812'],
          ['ENTREGA EST.', '01 jun — 04 jun 2026'],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="mono mute">{k}</div>
            <div className="display" style={{ fontSize: 16, marginTop: 6 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CheckoutClient({ products, shipping }: { products: Product[]; shipping: ShippingMethod[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const items = useMemo(() => seed(products), [products])

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = Math.round(subtotal * 0.1)
  const shipFee = shipping.find((s) => s.id === 'express')?.fee ?? 0
  const tax = Math.round((subtotal - discount) * 0.13) 
  const total = subtotal - discount + shipFee + tax

  return (
    <div className="container page">
      <div className="crumbs">
        <button onClick={() => router.push('/cart')} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Bolsa</button>
        <span className="sep">/</span><em>Checkout</em>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 0, marginBottom: 48, border: '1px solid var(--border)' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i + 1)} style={{
            padding: '16px 12px',
            background: i + 1 === step ? 'var(--text)' : 'var(--card)',
            color: i + 1 === step ? 'var(--bg-0)' : i + 1 < step ? 'var(--text)' : 'var(--text-dim)',
            borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
            border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>PASO {String(i + 1).padStart(2, '0')}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
        <div>
          {step === 6 ? <CheckoutDone /> : <CheckoutForm step={step} setStep={setStep} total={total} shipping={shipping} />}
        </div>
        <div>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 120 }}>
            <div className="display" style={{ fontSize: 18, marginBottom: 20 }}>TU BOLSA · {items.length} PIEZAS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, alignItems: 'center' }}>
                  <div style={{ aspectRatio: '1/1', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <img src={it.product.images[0]} alt={it.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{it.product.name}</div>
                    <div className="mono mute">{it.size} · {it.color} · ×{it.qty}</div>
                  </div>
                  <div className="mono">${it.product.price * it.qty}</div>
                </div>
              ))}
            </div>
            <Line label="Subtotal" value={`$${subtotal}`} />
            <Line label="Descuento KLAB10" value={`-$${discount}`} accent />
            <Line label="Envío exprés" value={`$${shipFee}`} />
            <Line label="IVA (13%)" value={`$${tax}`} />
            <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="display" style={{ fontSize: 16 }}>TOTAL</span>
              <span className="display" style={{ fontSize: 28 }}>${total}</span>
            </div>
            <div className="mono mute" style={{ marginTop: 14, fontSize: 11, textAlign: 'center' }}>✓ CADA PIEZA ESTÁ VERIFICADA POR EL LAB</div>
          </div>
        </div>
      </div>
    </div>
  )
}

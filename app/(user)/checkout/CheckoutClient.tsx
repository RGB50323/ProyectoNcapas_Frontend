'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ShippingMethod, CartItem, CouponPreview } from '@/lib/types'
import { PAYMENT_METHODS } from '@/lib/payments'
import { useAuth, getUserId, authFetch } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { clearCart, previewCoupon } from '@/lib/shop'
import { Icon } from '@/components/Icon'
import { Section, Field, Grid2, ReviewRow, Line } from '@/components/ui'

const STEPS = ['Datos', 'Dirección', 'Envío', 'Pago', 'Revisión', 'Listo']

// ─── Payment Picker ───────────────────────────────────────────
function PaymentPicker({
                           selected,
                           onChange,
                           transactionId,
                           onTransactionIdChange,
                       }: {
    selected: string
    onChange: (id: string) => void
    transactionId: string
    onTransactionIdChange: (v: string) => void
}) {
    const method = PAYMENT_METHODS.find((x) => x.id === selected) ?? PAYMENT_METHODS[0]
    const Form = method.Form
    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PAYMENT_METHODS.length}, 1fr)`, gap: 8, marginBottom: 24 }}>
                {PAYMENT_METHODS.map((x) => (
                    <button key={x.id} onClick={() => onChange(x.id)} style={{
                        padding: 16,
                        background: selected === x.id ? 'var(--elev)' : 'var(--card)',
                        border: '1px solid ' + (selected === x.id ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: 0, textAlign: 'left', color: 'var(--text)', cursor: 'pointer',
                    }}>
                        <div className="display" style={{ fontSize: 14 }}>{x.label}</div>
                        <div className="mono mute" style={{ marginTop: 4, fontSize: 11 }}>{x.desc}</div>
                    </button>
                ))}
            </div>
            <Form />
            {selected === 'bank' && (
                <div style={{ marginTop: 16 }}>
                    <div className="label">ID de transacción</div>
                    <input
                        className="input"
                        placeholder="TXN-123456"
                        value={transactionId}
                        onChange={(e) => onTransactionIdChange(e.target.value)}
                    />
                </div>
            )}
        </>
    )
}

// ─── Checkout Done ────────────────────────────────────────────
function CheckoutDone({ orderId }: { orderId: string }) {
    return (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 16 }}>
                ◆ PEDIDO CONFIRMADO · {orderId}
            </div>
            <h2 className="display" style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>
                TU PIEZA<br />HA SIDO <span style={{ color: 'var(--accent-2)' }}>ASEGURADA.</span>
            </h2>
            <p className="mute" style={{ maxWidth: 440, margin: '16px auto 32px', lineHeight: 1.7 }}>
                Pedido registrado. El equipo de autenticación de K LAB inspeccionará y despachará tus piezas.
                Recibirás una guía de rastreo cuando salga del laboratorio.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link href="/account" className="btn">Rastrear mi pedido <Icon.ArrowR /></Link>
                <Link href="/" className="btn btn-ghost">Volver al Lab</Link>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────
export default function CheckoutClient({ shipping }: { shipping: ShippingMethod[] }) {
    const router = useRouter()
    const { session } = useAuth()
    const { items, refresh: refreshCart, coupon, setCoupon } = useCart()

    const [step, setStep] = useState(1)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Dirección seleccionada
    const [addresses, setAddresses] = useState<any[]>([])
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

    // Método de envío seleccionado
    const [selectedShippingId, setSelectedShippingId] = useState(shipping[0]?.id ?? '')

    // Pago
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id)
    const [transactionId, setTransactionId] = useState('')

    // Aceptación de términos en el paso de revisión
    const [accepted, setAccepted] = useState(false)

    // Snapshot del resumen al confirmar, el carrito se vacía después
    const [confirmed, setConfirmed] = useState<{
        items: CartItem[]
        subtotal: number
        discount: number
        shipFee: number
        extraFee: number
        total: number
    } | null>(null)

    // Cupón aplicado en la bolsa, recalculado con el envío elegido
    const [preview, setPreview] = useState<CouponPreview | null>(null)

    // Cargar direcciones del usuario
    useEffect(() => {
        if (!session) return
        const userId = getUserId(session)
        if (!userId) return
        authFetch(`/addresses/user/${userId}`, session)
            .then((r) => r.json())
            .then((json) => {
                const data = json?.data ?? []
                setAddresses(data)
                const def = data.find((a: any) => a.isDefault) ?? data[0]
                if (def) setSelectedAddressId(def.id)
            })
            .catch(() => {})
    }, [session])

    // Recalcular el cupón cuando cambia el envío
    useEffect(() => {
        if (!session || !coupon) { setPreview(null); return }
        previewCoupon(session, { code: coupon, shippingMethodId: selectedShippingId || undefined })
            .then(setPreview)
            .catch(() => setPreview(null))
    }, [session, coupon, selectedShippingId])

    // Calcular totales
    const selectedShipping = shipping.find((s) => s.id === selectedShippingId) ?? shipping[0]
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const shipFee = selectedShipping?.fee ?? 0
    const discount = preview?.discountAmount ?? 0
    const selectedPaymentMethod = PAYMENT_METHODS.find((x) => x.id === paymentMethod)
    const extraFee = selectedPaymentMethod?.extraFee?.(subtotal) ?? 0
    const total = subtotal + shipFee - discount + extraFee

    // Mapear método de pago frontend → backend
    const paymentMethodMap: Record<string, string> = {
        card: 'CREDIT_CARD',
        bank: 'BANK_TRANSFER',
        cod: 'CASH_ON_DELIVERY',
    }

    // Confirmar pedido
    async function handleConfirm() {
        if (!session) return
        if (!selectedAddressId) { setError('Selecciona una dirección de envío'); return }
        if (!selectedShippingId) { setError('Selecciona un método de envío'); return }
        if (!accepted) { setError('Debes aceptar los términos para continuar'); return }

        setBusy(true)
        setError(null)

        try {
            const userId = getUserId(session)

            // 1. Crear la orden
            const orderRes = await authFetch('/orders/create', session, {
                method: 'POST',
                body: JSON.stringify({
                    customerId: userId,
                    shippingAddressId: selectedAddressId,
                    shippingMethodId: selectedShippingId,
                    couponId: preview?.couponId ?? null,
                    notes: null,
                }),
            })
            const orderJson = await orderRes.json()
            if (!orderRes.ok) throw new Error(orderJson?.message ?? 'Error al crear la orden')
            const order = orderJson.data
            const newOrderId = order.id

            // 2. Crear los order items desde el carrito
            for (const item of items) {
                const productRes = await authFetch(`/products/${item.productId}`, session)
                const productJson = await productRes.json()
                const sellerId = productJson?.data?.sellerId ?? null

                const itemRes = await authFetch('/order-items/create', session, {
                    method: 'POST',
                    body: JSON.stringify({
                        orderId: newOrderId,
                        productId: item.productId,
                        variantId: item.variantId ?? null,
                        sellerId: sellerId,
                        quantity: item.quantity,
                    }),
                })
                const itemJson = await itemRes.json()
                if (!itemRes.ok) throw new Error(itemJson?.message ?? 'Error al agregar item a la orden')
            }

            // 3. Procesar el pago
            const payRes = await authFetch('/payments/create', session, {
                method: 'POST',
                body: JSON.stringify({
                    orderId: newOrderId,
                    method: paymentMethodMap[paymentMethod] ?? 'CREDIT_CARD',
                    transactionId: paymentMethod === 'bank' ? transactionId : null,
                }),
            })
            if (!payRes.ok) {
                const payJson = await payRes.json()
                throw new Error(payJson?.message ?? 'Error al procesar el pago')
            }

            // Guardar el resumen antes de vaciar el carrito
            setConfirmed({ items, subtotal, discount, shipFee, extraFee, total })

            // 4. Vaciar el carrito
            await clearCart(session)
            setCoupon(null)
            await refreshCart()

            // 5. Mostrar confirmación
            setOrderId(newOrderId)
            setStep(6)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Algo salió mal')
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="container page">
            <div className="crumbs">
                <button
                    onClick={() => router.push('/cart')}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                >
                    Bolsa
                </button>
                <span className="sep">/</span><em>Checkout</em>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 0, marginBottom: 48, border: '1px solid var(--border)' }}>
                {STEPS.map((s, i) => (
                    <button key={s} onClick={() => i + 1 < step && setStep(i + 1)} style={{
                        padding: '16px 12px',
                        background: i + 1 === step ? 'var(--text)' : 'var(--card)',
                        color: i + 1 === step ? 'var(--bg-0)' : i + 1 < step ? 'var(--text)' : 'var(--text-dim)',
                        borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                        border: 'none', cursor: i + 1 < step ? 'pointer' : 'default', textAlign: 'left',
                    }}>
                        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em' }}>PASO {String(i + 1).padStart(2, '0')}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s}</div>
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48 }}>
                {/* Left — form */}
                <div>
                    {step === 6 && orderId ? (
                        <CheckoutDone orderId={orderId} />
                    ) : (
                        <>
                            {/* Paso 1 — Datos */}
                            {step === 1 && (
                                <Section title="Datos personales" eyebrow="◇ PASO 01">
                                    <Grid2>
                                        <Field label="Nombre" value={session?.firstName} />
                                        <Field label="Apellido" value={session?.lastName} />
                                    </Grid2>
                                    <Field label="Correo" value={session?.email} />
                                </Section>
                            )}

                            {/* Paso 2 — Dirección */}
                            {step === 2 && (
                                <Section title="Dirección de envío" eyebrow="◇ PASO 02">
                                    {addresses.length === 0 ? (
                                        <div className="card" style={{ padding: 24 }}>
                                            <div className="mute">No tienes direcciones guardadas.</div>
                                            <Link href="/account?tab=addresses" className="btn btn-ghost" style={{ marginTop: 12 }}>
                                                Agregar dirección
                                            </Link>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {addresses.map((a: any) => (
                                                <div
                                                    key={a.id}
                                                    onClick={() => setSelectedAddressId(a.id)}
                                                    style={{
                                                        padding: 20,
                                                        border: '1px solid ' + (selectedAddressId === a.id ? 'var(--accent)' : 'var(--border)'),
                                                        background: selectedAddressId === a.id ? 'var(--elev)' : 'var(--card)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <div className="display" style={{ fontSize: 14 }}>{a.alias ?? a.street}</div>
                                                    <div className="mono mute" style={{ marginTop: 4 }}>
                                                        {a.street}, {a.city}, {a.country}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Section>
                            )}

                            {/* Paso 3 — Envío */}
                            {step === 3 && (
                                <Section title="Método de envío" eyebrow="◇ PASO 03">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {shipping.map((s) => (
                                            <div
                                                key={s.id}
                                                onClick={() => setSelectedShippingId(s.id)}
                                                style={{
                                                    padding: 20,
                                                    border: '1px solid ' + (selectedShippingId === s.id ? 'var(--accent)' : 'var(--border)'),
                                                    background: selectedShippingId === s.id ? 'var(--elev)' : 'var(--card)',
                                                    borderRadius: 0,
                                                    display: 'grid', gridTemplateColumns: '24px 1fr auto',
                                                    gap: 16, alignItems: 'center', cursor: 'pointer',
                                                }}
                                            >
                        <span style={{
                            width: 18, height: 18, borderRadius: 99,
                            border: '1px solid ' + (selectedShippingId === s.id ? 'var(--accent)' : 'var(--border-bright)'),
                            background: selectedShippingId === s.id
                                ? 'radial-gradient(circle, var(--accent) 0 4px, transparent 5px)'
                                : 'transparent',
                        }} />
                                                <div>
                                                    <div className="display" style={{ fontSize: 16 }}>{s.name}</div>
                                                    <div className="mono mute" style={{ marginTop: 4 }}>{s.eta}</div>
                                                </div>
                                                <div className="display" style={{ fontSize: 18 }}>
                                                    {s.fee === 0 ? 'GRATIS' : `$${s.fee}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {/* Paso 4 — Pago */}
                            {step === 4 && (
                                <Section title="Método de pago" eyebrow="◇ PASO 04">
                                    <PaymentPicker
                                        selected={paymentMethod}
                                        onChange={(id) => {
                                            setPaymentMethod(id)
                                            setError(null)
                                        }}
                                        transactionId={transactionId}
                                        onTransactionIdChange={(v) => {
                                            setTransactionId(v)
                                            if (v.trim()) setError(null)
                                        }}
                                    />
                                </Section>
                            )}

                            {/* Paso 5 — Revisión con botones EDITAR funcionando */}
                            {step === 5 && (
                                <Section title="Revisa tu pedido" eyebrow="◇ PASO 05">
                                    <ReviewRow
                                        label="Contacto"
                                        value={session?.email ?? ''}
                                    />
                                    <ReviewRow
                                        label="Enviar a"
                                        value={(() => {
                                            const a = addresses.find((x) => x.id === selectedAddressId)
                                            return a ? `${a.street}, ${a.city}, ${a.country}` : '—'
                                        })()}
                                        onEdit={() => setStep(2)}
                                    />
                                    <ReviewRow
                                        label="Método"
                                        value={`${selectedShipping?.name} · ${selectedShipping?.eta}`}
                                        onEdit={() => setStep(3)}
                                    />
                                    <ReviewRow
                                        label="Pago"
                                        value={PAYMENT_METHODS.find((x) => x.id === paymentMethod)?.label ?? ''}
                                        onEdit={() => setStep(4)}
                                    />
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 24, color: 'var(--text-dim)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setAccepted((v) => !v)}
                                            aria-pressed={accepted}
                                            style={{
                                                width: 14, height: 14, flexShrink: 0, marginTop: 3, padding: 0, cursor: 'pointer',
                                                border: '1px solid var(--text)',
                                                background: accepted ? 'var(--text)' : 'transparent',
                                                color: 'var(--bg-0)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            {accepted && <Icon.Check />}
                                        </button>
                                        <span style={{ fontSize: 12, lineHeight: 1.6 }}>
                      Confirmo que todas las piezas de este pedido han sido verificadas por el equipo de autenticación de K LAB. Acepto los{' '}
                                            <Link href="/terms" target="_blank" style={{ textDecoration: 'underline' }}>Términos de venta</Link> y la{' '}
                                            <Link href="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>Política de devoluciones</Link>.
                    </span>
                                    </div>
                                </Section>
                            )}

                            {error && (
                                <div style={{ marginTop: 16, color: 'var(--accent-error, red)', fontSize: 13 }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
                                <button className="btn btn-ghost" disabled={step === 1} onClick={() => setStep(step - 1)}>
                                    ← Atrás
                                </button>
                                {step < 5 && (
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            if (step === 4 && paymentMethod === 'bank' && !transactionId.trim()) {
                                                setError('Debes ingresar el ID de transacción para continuar')
                                                return
                                            }
                                            setError(null)
                                            setStep(step + 1)
                                        }}
                                    >
                                        Continuar →
                                    </button>
                                )}
                                {step === 5 && (
                                    <button
                                        className="btn btn-lg"
                                        onClick={handleConfirm}
                                        disabled={busy || !accepted}
                                    >
                                        {busy ? 'Procesando...' : 'Confirmar y pagar'} <Icon.ArrowR />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right — order summary */}
                <div>
                    <div className="card" style={{ padding: 24, position: 'sticky', top: 120 }}>
                        {(() => {
                            const sum = step === 6 && confirmed
                                ? confirmed
                                : { items, subtotal, discount, shipFee, extraFee, total }
                            return (
                                <>
                                    <div className="display" style={{ fontSize: 18, marginBottom: 20 }}>
                                        TU BOLSA · {sum.items.length} PIEZAS
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                        {sum.items.map((it) => (
                                            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{it.productName}</div>
                                                    <div className="mono mute">{it.variantSize} · {it.variantColorName} · ×{it.quantity}</div>
                                                </div>
                                                <div className="mono">${it.unitPrice * it.quantity}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Line label="Subtotal" value={`$${sum.subtotal}`} />
                                    {sum.discount > 0 && <Line label="Descuento Cupón" value={`-$${sum.discount}`} accent />}
                                    <Line label="Envío" value={sum.shipFee === 0 ? 'GRATIS' : `$${sum.shipFee}`} />
                                    {sum.extraFee > 0 && <Line label="Contra entrega" value={`+$${sum.extraFee}`} />}
                                    <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="display" style={{ fontSize: 16 }}>TOTAL</span>
                                        <span className="display" style={{ fontSize: 28 }}>${sum.total}</span>
                                    </div>
                                </>
                            )
                        })()}
                        <div className="mono mute" style={{ marginTop: 14, fontSize: 11, textAlign: 'center' }}>
                            ✓ CADA PIEZA ESTÁ VERIFICADA POR EL LAB
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

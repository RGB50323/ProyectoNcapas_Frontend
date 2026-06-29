'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth, type Role } from '@/lib/auth'
import { admin, type AdminUser, type AdminOrder, type AdminOrderItem, type AdminAddress } from '@/lib/admin'
import { Select } from '@/components/Select'
import { Icon } from '@/components/Icon'
import Modal from '@/components/Modal'
import { PageLoader } from '@/components/PageLoader'
import { useToast } from '@/hooks/useToast'

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'yellow', CONFIRMED: 'blue', SHIPPED: 'blue', DELIVERED: 'green', CANCELLED: 'red', REFUNDED: 'gray',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mono mute" style={{ fontSize: 11, letterSpacing: '0.12em' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 6 }}>{value}</div>
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const { show, ToastContainer } = useToast()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [addresses, setAddresses] = useState<AdminAddress[]>([])
  const [loading, setLoading] = useState(true)

  const [role, setRole] = useState<string>('')
  const [savingRole, setSavingRole] = useState(false)
  const [confirmRole, setConfirmRole] = useState(false)

  const [openOrder, setOpenOrder] = useState<string | null>(null)
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, AdminOrderItem[]>>({})

  useEffect(() => {
    if (!session || !id) return
    setLoading(true)
    Promise.allSettled([
      admin.getUser(session, id),
      admin.ordersByCustomer(session, id),
      admin.addressesByUser(session, id),
    ]).then(([u, o, a]) => {
      if (u.status === 'fulfilled') { setUser(u.value); setRole(u.value.role) }
      if (o.status === 'fulfilled') setOrders(o.value)
      if (a.status === 'fulfilled') setAddresses(a.value)
      setLoading(false)
    })
  }, [session, id])

  const toggleOrder = async (orderId: string) => {
    if (openOrder === orderId) { setOpenOrder(null); return }
    setOpenOrder(orderId)
    if (!itemsByOrder[orderId] && session) {
      try {
        const items = await admin.orderItems(session, orderId)
        setItemsByOrder((m) => ({ ...m, [orderId]: items }))
      } catch {
        setItemsByOrder((m) => ({ ...m, [orderId]: [] }))
      }
    }
  }

  const saveRole = async () => {
    if (!session || !user) return
    setSavingRole(true)
    try {
      await admin.changeRole(session, user.uuid, role as Role)
      setUser({ ...user, role: role as Role })
      setConfirmRole(false)
      show('Rol actualizado', 'success')
    } catch (e) {
      show(e instanceof Error ? e.message : 'No se pudo cambiar el rol', 'error')
    } finally {
      setSavingRole(false)
    }
  }

  if (loading) return <PageLoader />
  if (!user) return <div className="mono mute" style={{ padding: 32 }}>Usuario no encontrado.</div>

  return (
    <div>
      <ToastContainer />
      <button className="btn btn-ghost" style={{ marginBottom: 20, padding: '8px 14px', fontSize: 11 }} onClick={() => router.push('/admin/users')}>← Usuarios</button>

      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ USUARIO</div>
            <h1 className="display" style={{ fontSize: 'clamp(26px, 6.5vw, 36px)', marginTop: 8 }}>{user.firstName} {user.lastName}</h1>
            <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>{user.email}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div>
              <div className="label">Rol</div>
              <Select value={role} options={[{ value: 'BUYER', label: 'BUYER' }, { value: 'SELLER', label: 'SELLER' }, { value: 'ADMIN', label: 'ADMIN' }]} onChange={setRole} width={160} ariaLabel="Rol" />
            </div>
            <button className="btn" onClick={() => setConfirmRole(true)} disabled={savingRole || role === user.role}>Guardar</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px 32px', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Field label="NOMBRE" value={user.firstName} />
          <Field label="APELLIDO" value={user.lastName} />
          <Field label="CORREO" value={user.email} />
          <Field label="TELÉFONO" value={user.phone || <span className="mute">—</span>} />
        </div>
      </div>

      {addresses.length > 0 && (
        <div className="card" style={{ padding: 28, marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 18, marginBottom: 16 }}>DIRECCIONES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {addresses.map((a) => (
              <div key={a.id} className="mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                {a.street}, {a.city}, {a.state} · {a.country} {a.zipCode}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <div className="display" style={{ fontSize: 18, marginBottom: 16 }}>PEDIDOS · {orders.length}</div>
        {orders.length === 0 && <div className="mono mute" style={{ fontSize: 13 }}>Este usuario no tiene pedidos.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((o) => (
            <div key={o.id} style={{ border: '1px solid var(--border)', borderRadius: 2 }}>
              <button
                onClick={() => toggleOrder(o.id)}
                style={{ width: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto auto', gap: 16, alignItems: 'center', padding: '14px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                <div>
                  <div className="mono mute" style={{ fontSize: 11 }}>PEDIDO</div>
                  <div className="display" style={{ fontSize: 13, marginTop: 2, color:'white' }}>{o.id.slice(0, 8).toUpperCase()}</div>
                </div>
                <div className="mono mute" style={{ fontSize: 12 }}>{String(o.createdAt).replace('T', ' ').slice(0, 16)}</div>
                <span className={`pill ${STATUS_COLOR[o.status] ?? 'gray'}`}>{o.status}</span>
                <div className="display" style={{ fontSize: 16, color:'white' }}>${o.total}</div>
                <span className="fgroup-toggle" style={{ color: 'var(--text-mute)' }}>{openOrder === o.id ? <Icon.Minus /> : <Icon.Plus />}</span>
              </button>

              {openOrder === o.id && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--bg-0)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {(itemsByOrder[o.id] ?? []).map((it) => (
                      <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center', fontSize: 13 }}>
                        <div>
                          <div style={{ color: 'var(--text)' }}>{it.productName}</div>
                          <div className="mono mute" style={{ fontSize: 11 }}>
                            {[it.variantSize, it.variantColorName, it.sellerStoreName].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div className="mono mute">x{it.quantity} · ${it.unitPrice}</div>
                        <div className="mono" style={{ textAlign: 'right' }}>${it.totalPrice}</div>
                      </div>
                    ))}
                    {itemsByOrder[o.id] && itemsByOrder[o.id].length === 0 && (
                      <div className="mono mute" style={{ fontSize: 12 }}>Sin ítems.</div>
                    )}
                    {!itemsByOrder[o.id] && <div className="mono mute" style={{ fontSize: 12 }}>Cargando ítems…</div>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px 24px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <Field label="ENVÍO" value={o.shippingMethodName || '—'} />
                    <Field label="DIRECCIÓN" value={[o.shippingAddressStreet, o.shippingAddressCity, o.shippingAddressCountry].filter(Boolean).join(', ') || '—'} />
                    <Field label="CUPÓN" value={o.couponCode || '—'} />
                    <Field label="SUBTOTAL" value={`$${o.subtotal}`} />
                    <Field label="ENVÍO" value={`$${o.shippingCost}`} />
                    <Field label="DESCUENTO" value={`-$${o.discountAmount}`} />
                    <Field label="TOTAL" value={`$${o.total}`} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal open={confirmRole} title="CAMBIAR ROL" onClose={() => setConfirmRole(false)} width={480}>
        <p className="mute" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          ¿Seguro que querés cambiar el rol de{' '}
          <strong style={{ color: 'var(--text)' }}>{user.firstName} {user.lastName}</strong>{' '}
          a <strong style={{ color: 'var(--text)' }}>{role}</strong>?
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" style={{ padding: '10px 16px', fontSize: 12 }} onClick={() => setConfirmRole(false)} disabled={savingRole}>Cancelar</button>
          <button className="btn" style={{ padding: '10px 24px', fontSize: 12 }} onClick={saveRole} disabled={savingRole}>{savingRole ? 'Guardando…' : 'Confirmar'}</button>
        </div>
      </Modal>
    </div>
  )
}

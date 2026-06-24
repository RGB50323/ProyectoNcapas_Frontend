'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { admin, type AdminOrder, type AdminOrderItem } from '@/lib/admin'
import type { OrderStatus, Shipment } from '@/lib/types'
import { getShipmentTracking } from '@/lib/api'
import { formatDateSV } from '@/lib/datetime'
import { Icon } from '@/components/Icon'
import { StatusPill } from '@/components/ui'

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

function ShipmentControl({ orderId }: { orderId: string }) {
  const { session } = useAuth()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    getShipmentTracking(orderId, session)
        .then(setShipment)
        .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el envio'))
        .finally(() => setLoading(false))
  }, [session, orderId])

  return (
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>ENVÍO</div>
        {loading ? (
            <div className="mono mute" style={{ fontSize: 12 }}>Cargando envío...</div>
        ) : error ? (
            <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2, #c0392b)' }}>{error}</div>
        ) : shipment ? (
            <div className="mono mute" style={{ fontSize: 11, lineHeight: 1.7 }}>
              GUÍA {shipment.trackingNumber} · {shipment.shippingMethod ?? '—'} · ENTREGA {shipment.estimatedDelivery ? formatDateSV(shipment.estimatedDelivery, true) : '—'}
              <br />
              El rastreo del cliente sigue el estado del pedido de arriba.
            </div>
        ) : null}
      </div>
  )
}

export default function AdminOrdersPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, AdminOrderItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    admin.listOrders(session)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
  }, [session])

  async function toggleOrder(orderId: string) {
    if (openId === orderId) {
      setOpenId(null)
      return
    }
    setOpenId(orderId)
    if (!items[orderId] && session) {
      setLoadingItems(orderId)
      try {
        const orderItems = await admin.orderItems(session, orderId)
        setItems((prev) => ({ ...prev, [orderId]: orderItems }))
      } catch {
        setItems((prev) => ({ ...prev, [orderId]: [] }))
      } finally {
        setLoadingItems(null)
      }
    }
  }

  // ← Función nueva para cambiar el estado
  async function handleStatusChange(orderId: string, newStatus: string) {
    if (!session) return
    setUpdatingStatus(orderId)
    try {
      await admin.patchOrder(session, orderId, newStatus)
      // Actualizar el estado localmente sin recargar toda la lista
      setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    } catch (err) {
      alert('Error al actualizar el estado')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (loading) {
    return (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <div className="mono mute">Cargando pedidos...</div>
        </div>
    )
  }

  return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
          <div>
            <div className="eyebrow accent">◇ PEDIDOS · TODOS LOS CANALES</div>
            <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PEDIDOS</h1>
            <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>
              {orders.length} totales
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost">CSV</button>
            <button className="btn btn-ghost">JSON</button>
            <button className="btn">XML a ERP <Icon.ArrowR /></button>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Subtotal</th>
              <th>Envío</th>
              <th>Total</th>
              <th>Guía</th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            {orders.map((o) => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td>
                    <span className="display" style={{ fontSize: 13 }}>
                      {o.id.slice(0, 8).toUpperCase()}
                    </span>
                    </td>
                    <td>{o.customerFullName}</td>
                    <td className="mono mute">
                      {formatDateSV(o.createdAt)}
                    </td>

                    {/* ← Dropdown de estado */}
                    <td>
                     <select
                          value={o.status}
                          disabled={updatingStatus === o.id}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            letterSpacing: '0.1em',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            opacity: updatingStatus === o.id ? 0.5 : 1,
                          }}
                      >
                        {(o.status === 'DELIVERED'
                            ? ['DELIVERED', 'REFUNDED']
                            : ORDER_STATUSES
                        ).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    <td className="mono">${o.subtotal}</td>
                    <td className="mono">${o.shippingCost}</td>
                    <td><span className="display" style={{ fontSize: 14 }}>${o.total}</span></td>
                    <td className="mono mute">{o.trackingNumber ?? '—'}</td>
                    <td>
                      <button
                          className="mono accent"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => toggleOrder(o.id)}
                      >
                        {openId === o.id ? 'CERRAR' : 'ABRIR →'}
                      </button>
                    </td>
                  </tr>

                  {/* Detalle de items */}
                  {openId === o.id && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <div style={{ padding: 20, background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                            {loadingItems === o.id ? (
                                <div className="mono mute">Cargando items...</div>
                            ) : (items[o.id] ?? []).length === 0 ? (
                                <div className="mono mute">Sin items registrados.</div>
                            ) : (
                                <table className="table" style={{ margin: 0 }}>
                                  <thead>
                                  <tr>
                                    <th>Producto</th>
                                    <th>Variante</th>
                                    <th>Vendedor</th>
                                    <th>Cant.</th>
                                    <th>Precio unit.</th>
                                    <th>Total</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  {(items[o.id] ?? []).map((item) => (
                                      <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td className="mono mute">
                                          {item.variantSize ?? '—'} · {item.variantColorName ?? '—'}
                                        </td>
                                        <td>{item.sellerStoreName ?? '—'}</td>
                                        <td>{item.quantity}</td>
                                        <td className="mono">${item.unitPrice}</td>
                                        <td className="mono">${item.totalPrice}</td>
                                      </tr>
                                  ))}
                                  </tbody>
                                </table>
                            )}

                            <div style={{ marginTop: 16, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                              {o.shippingAddressStreet && (
                                  <div>
                                    <div className="mono mute" style={{ fontSize: 11 }}>DIRECCIÓN</div>
                                    <div style={{ fontSize: 13 }}>
                                      {o.shippingAddressStreet}, {o.shippingAddressCity}, {o.shippingAddressCountry}
                                    </div>
                                  </div>
                              )}
                              {o.shippingMethodName && (
                                  <div>
                                    <div className="mono mute" style={{ fontSize: 11 }}>MÉTODO DE ENVÍO</div>
                                    <div style={{ fontSize: 13 }}>{o.shippingMethodName}</div>
                                  </div>
                              )}
                              {o.couponCode && (
                                  <div>
                                    <div className="mono mute" style={{ fontSize: 11 }}>CUPÓN</div>
                                    <div style={{ fontSize: 13 }}>{o.couponCode}</div>
                                  </div>
                              )}
                              {o.notes && (
                                  <div>
                                    <div className="mono mute" style={{ fontSize: 11 }}>NOTAS</div>
                                    <div style={{ fontSize: 13 }}>{o.notes}</div>
                                  </div>
                              )}
                            </div>

                            <ShipmentControl orderId={o.id} />
                          </div>
                        </td>
                      </tr>
                  )}
                </React.Fragment>
            ))}
            </tbody>
          </table>

          {orders.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div className="mono mute">No hay pedidos registrados.</div>
              </div>
          )}
        </div>
      </>
  )
}
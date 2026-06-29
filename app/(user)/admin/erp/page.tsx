'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { admin, type AdminErpOrder } from '@/lib/admin'
import { formatDateSV } from '@/lib/datetime'

export default function AdminErpPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<AdminErpOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [openReference, setOpenReference] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) {
      setQuery(ref)
      setOpenReference(ref)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    admin.listErpOrders(session)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false))
  }, [session])

  const filteredOrders = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return orders
    return orders.filter((order) =>
      order.erpReference.toLowerCase().includes(clean) ||
      order.sourceOrderId.toLowerCase().includes(clean) ||
      order.customerName.toLowerCase().includes(clean) ||
      order.customerEmail.toLowerCase().includes(clean)
    )
  }, [orders, query])

  const totalReceived = orders.reduce((sum, order) => sum + Number(order.total), 0)

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div className="mono mute">Cargando ERP...</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
        <div>
          <div className="eyebrow accent">◇ ERP · RECEPCIÓN SIMULADA</div>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>ERP</h1>
          <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>
            {orders.length} órdenes recibidas · ${totalReceived.toFixed(2)} acumulado
          </div>
        </div>
        <div style={{ minWidth: 320 }}>
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar referencia, pedido o cliente"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
          <tr>
            <th>Referencia ERP</th>
            <th>Pedido origen</th>
            <th>Cliente</th>
            <th>Recibido</th>
            <th>Total</th>
            <th>Items</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          {filteredOrders.map((order) => (
            <React.Fragment key={order.erpReference}>
              <tr>
                <td>
                  <span className="display" style={{ fontSize: 13 }}>{order.erpReference}</span>
                </td>
                <td className="mono mute">{order.sourceOrderId.slice(0, 8).toUpperCase()}</td>
                <td>
                  <div>{order.customerName}</div>
                  <div className="mono mute" style={{ fontSize: 11 }}>{order.customerEmail}</div>
                </td>
                <td className="mono mute">{formatDateSV(order.receivedAt, true)}</td>
                <td><span className="display" style={{ fontSize: 14 }}>${order.total}</span></td>
                <td className="mono">{order.items.length}</td>
                <td>
                  <button
                    className="mono accent"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setOpenReference(openReference === order.erpReference ? null : order.erpReference)}
                  >
                    {openReference === order.erpReference ? 'CERRAR' : 'ABRIR →'}
                  </button>
                </td>
              </tr>

              {openReference === order.erpReference && (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div style={{ padding: 20, background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 16 }}>
                        <div>
                          <div className="mono mute" style={{ fontSize: 11 }}>FECHA DEL PEDIDO</div>
                          <div style={{ fontSize: 13 }}>{formatDateSV(order.orderDate, true)}</div>
                        </div>
                        <div>
                          <div className="mono mute" style={{ fontSize: 11 }}>DIRECCIÓN COPIADA AL ERP</div>
                          <div style={{ fontSize: 13 }}>{order.shippingAddress}</div>
                        </div>
                        <div>
                          <div className="mono mute" style={{ fontSize: 11 }}>TOTALES</div>
                          <div className="mono" style={{ fontSize: 12 }}>
                            SUB ${order.subtotal} · ENVÍO ${order.shippingCost} · DESC ${order.discountAmount}
                          </div>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Producto</th>
                          <th>Variante</th>
                          <th>Cant.</th>
                          <th>Precio unit.</th>
                          <th>Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="mono">{item.sku}</td>
                            <td>{item.productName}</td>
                            <td className="mono mute">{item.variantDescription ?? '—'}</td>
                            <td>{item.quantity}</td>
                            <td className="mono">${item.unitPrice}</td>
                            <td className="mono">${item.totalPrice}</td>
                          </tr>
                        ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          </tbody>
        </table>
        </div>

        {filteredOrders.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div className="mono mute">No hay órdenes ERP para mostrar.</div>
          </div>
        )}
      </div>
    </>
  )
}

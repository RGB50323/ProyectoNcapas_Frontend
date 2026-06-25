'use client'
import Link from 'next/link'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { admin, type AdminErpBulkExport, type AdminErpExport, type AdminOrder, type AdminOrderItem, type ErpExportStatus } from '@/lib/admin'
import type { OrderStatus, Shipment } from '@/lib/types'
import { getShipmentTracking } from '@/lib/api'
import { formatDateSV } from '@/lib/datetime'
import { Icon } from '@/components/Icon'
import { StatusPill } from '@/components/ui'
import Modal from '@/components/Modal'
import { Select } from '@/components/Select'

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({
  value: status,
  label: status,
}))

const ERP_STATUS_META: Record<ErpExportStatus | 'NOT_EXPORTED', { label: string; cls: string }> = {
  NOT_EXPORTED: { label: 'Pendiente ERP', cls: 'yellow' },
  PENDING_EXPORT: { label: 'Pendiente ERP', cls: 'yellow' },
  EXPORTED: { label: 'Exportado', cls: 'green' },
  REJECTED: { label: 'Rechazado', cls: 'red' },
  FAILED: { label: 'Fallido', cls: 'red' },
}

function ErpStatusPill({ status }: { status: ErpExportStatus | 'NOT_EXPORTED' }) {
  const meta = ERP_STATUS_META[status]
  return <span className={`pill ${meta.cls}`}><Icon.Dot /> {meta.label}</span>
}

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
  const [erpExports, setErpExports] = useState<Record<string, AdminErpExport>>({})
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, AdminOrderItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [confirmExportOrder, setConfirmExportOrder] = useState<AdminOrder | null>(null)
  const [bulkExportOpen, setBulkExportOpen] = useState(false)
  const [bulkExporting, setBulkExporting] = useState(false)
  const [bulkResult, setBulkResult] = useState<AdminErpBulkExport | null>(null)

  useEffect(() => {
    if (!session) return
    Promise.all([
      admin.listOrders(session),
      admin.listErpExports(session).catch(() => []),
    ])
        .then(([ordersData, exportsData]) => {
          setOrders(ordersData)
          setErpExports(indexExports(exportsData))
        })
        .catch(() => {
          setOrders([])
          setErpExports({})
        })
        .finally(() => setLoading(false))
  }, [session])

  const erpCounts = useMemo(() => {
    const exported = orders.filter((order) => erpExports[order.id]?.erpExportStatus === 'EXPORTED').length
    const rejected = orders.filter((order) => erpExports[order.id]?.erpExportStatus === 'REJECTED').length
    const failed = orders.filter((order) => erpExports[order.id]?.erpExportStatus === 'FAILED').length
    return {
      exported,
      rejected,
      failed,
      pending: orders.length - exported,
    }
  }, [orders, erpExports])

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

  async function handleStatusChange(orderId: string, newStatus: string) {
    if (!session) return
    setUpdatingStatus(orderId)
    try {
      await admin.patchOrder(session, orderId, newStatus)
      setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    } catch {
      alert('Error al actualizar el estado')
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function handleExportToErp(orderId: string) {
    if (!session) return
    setExportingId(orderId)
    try {
      const result = await admin.exportOrderToErp(session, orderId)
      setErpExports((prev) => ({ ...prev, [orderId]: result }))
      setConfirmExportOrder(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar a ERP')
    } finally {
      setExportingId(null)
    }
  }

  async function handleBulkExportToErp() {
    if (!session) return
    setBulkExporting(true)
    setBulkResult(null)
    try {
      const result = await admin.exportPendingOrdersToErp(session)
      setBulkResult(result)
      setErpExports((prev) => ({ ...prev, ...indexExports(result.results) }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar pendientes a ERP')
    } finally {
      setBulkExporting(false)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 24 }}>
          <div>
            <div className="eyebrow accent">◇ PEDIDOS · TODOS LOS CANALES</div>
            <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PEDIDOS</h1>
            <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>
              {orders.length} totales · {erpCounts.pending} pendientes ERP · {erpCounts.exported} exportados
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => { setBulkResult(null); setBulkExportOpen(true) }}>
              Exportar pendientes ERP
            </button>
            <Link className="btn" href="/admin/erp">ERP <Icon.ArrowR /></Link>
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
              <th>ERP</th>
              <th>Subtotal</th>
              <th>Envío</th>
              <th>Total</th>
              <th>Guía</th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            {orders.map((o) => {
              const erpExport = erpExports[o.id]
              const erpStatus = erpExport?.erpExportStatus ?? 'NOT_EXPORTED'
              return (
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

                      <td>
                        {(o.status === 'REFUNDED' || o.status === 'DELIVERED') ? (
                            <StatusPill status={o.status as OrderStatus} />
                        ) : (
                            <div style={{ opacity: updatingStatus === o.id ? 0.55 : 1, pointerEvents: updatingStatus === o.id ? 'none' : 'auto' }}>
                              <Select
                                  value={o.status}
                                  options={ORDER_STATUS_OPTIONS}
                                  onChange={(value) => handleStatusChange(o.id, value)}
                                  width={132}
                                  ariaLabel="Estado del pedido"
                              />
                            </div>
                        )}
                      </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <ErpStatusPill status={erpStatus} />
                        {erpExport?.erpExportStatus === 'EXPORTED' && erpExport.erpReference ? (
                          <Link className="mono accent" style={{ fontSize: 11 }} href={`/admin/erp?ref=${erpExport.erpReference}`}>
                            VER EN ERP
                          </Link>
                        ) : (
                          <button
                              className="mono accent"
                              disabled={exportingId === o.id}
                              onClick={() => setConfirmExportOrder(o)}
                              style={{ background: 'none', border: 'none', cursor: exportingId === o.id ? 'default' : 'pointer', opacity: exportingId === o.id ? 0.5 : 1, fontSize: 11 }}
                          >
                            {exportingId === o.id ? 'EXPORTANDO...' : 'EXPORTAR ERP'}
                          </button>
                        )}
                      </div>
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

                  {openId === o.id && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0 }}>
                          <div style={{ padding: 20, background: 'var(--bg-1)', borderTop: '1px solid var(--border)' }}>
                            {erpExport?.erpErrorMessage && (
                                <div className="mono" style={{ fontSize: 11, color: 'var(--accent-2)', marginBottom: 16 }}>
                                  ERP · {erpExport.erpErrorMessage}
                                </div>
                            )}

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
              )
            })}
            </tbody>
          </table>

          {orders.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div className="mono mute">No hay pedidos registrados.</div>
              </div>
          )}
        </div>

        <Modal
            open={bulkExportOpen}
            title="Exportar pendientes ERP"
            onClose={() => bulkExporting ? undefined : setBulkExportOpen(false)}
            width={620}
        >
          <div>
            <p style={{ marginTop: 0, lineHeight: 1.6, color: 'var(--text-dim)' }}>
              Se exportarán únicamente pedidos en estado DELIVERED que todavía no estén exportados al ERP. Los pedidos ya exportados se omitirán y cualquier rechazo o fallo quedará registrado sin detener el proceso.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
              <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--card)' }}>
                <div className="mono mute" style={{ fontSize: 11 }}>PENDIENTES ERP</div>
                <div className="display" style={{ fontSize: 20, marginTop: 6 }}>{erpCounts.pending}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--card)' }}>
                <div className="mono mute" style={{ fontSize: 11 }}>EXPORTADOS</div>
                <div className="display" style={{ fontSize: 20, marginTop: 6 }}>{erpCounts.exported}</div>
              </div>
              <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--card)' }}>
                <div className="mono mute" style={{ fontSize: 11 }}>ALERTAS</div>
                <div className="display" style={{ fontSize: 20, marginTop: 6 }}>{erpCounts.rejected + erpCounts.failed}</div>
              </div>
            </div>

            {bulkResult && (
                <div style={{ border: '1px solid var(--border)', background: 'var(--bg-0)', padding: 14, marginTop: 18 }}>
                  <div className="mono mute" style={{ fontSize: 11, marginBottom: 8 }}>RESULTADO</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                    <span>{bulkResult.exportedCount} exportados</span>
                    <span>{bulkResult.rejectedCount} rechazados</span>
                    <span>{bulkResult.failedCount} fallidos</span>
                    <span>{bulkResult.skippedCount} omitidos</span>
                  </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button
                  className="btn btn-ghost"
                  disabled={bulkExporting}
                  onClick={() => setBulkExportOpen(false)}
              >
                {bulkResult ? 'Cerrar' : 'Cancelar'}
              </button>
              {!bulkResult && (
                  <button
                      className="btn"
                      disabled={bulkExporting}
                      onClick={handleBulkExportToErp}
                  >
                    {bulkExporting ? 'Exportando...' : 'Confirmar exportación'}
                  </button>
              )}
            </div>
          </div>
        </Modal>

        <Modal
            open={confirmExportOrder !== null}
            title="Exportar a ERP"
            onClose={() => exportingId ? undefined : setConfirmExportOrder(null)}
            width={560}
        >
          {confirmExportOrder && (
              <div>
                <div className="mono mute" style={{ fontSize: 11, marginBottom: 12 }}>
                  PEDIDO {confirmExportOrder.id.slice(0, 8).toUpperCase()}
                </div>
                {confirmExportOrder.status === 'DELIVERED' ? (
                    <p style={{ marginTop: 0, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                      Se enviará una copia del pedido al ERP simulado. El ERP validará cliente, items, SKU, cantidades, precios, total y fecha del pedido antes de generar una referencia.
                    </p>
                ) : (
                    <div style={{ border: '1px solid var(--border)', background: 'var(--card)', padding: 14, marginBottom: 18 }}>
                      <div className="mono" style={{ color: 'var(--accent-2)', fontSize: 11, marginBottom: 8 }}>EXPORTACIÓN NO DISPONIBLE</div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim)' }}>
                        Este pedido debe estar en estado DELIVERED para poder exportarse al ERP. Cambiá el estado del pedido a DELIVERED y volvé a intentarlo.
                      </div>
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
                  <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--card)' }}>
                    <div className="mono mute" style={{ fontSize: 11 }}>CLIENTE</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>{confirmExportOrder.customerFullName}</div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--card)' }}>
                    <div className="mono mute" style={{ fontSize: 11 }}>TOTAL</div>
                    <div className="display" style={{ fontSize: 18, marginTop: 6 }}>${confirmExportOrder.total}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                  <button
                      className="btn btn-ghost"
                      disabled={exportingId === confirmExportOrder.id}
                      onClick={() => setConfirmExportOrder(null)}
                  >
                    Cancelar
                  </button>
                  <button
                      className="btn"
                      disabled={exportingId === confirmExportOrder.id || confirmExportOrder.status !== 'DELIVERED'}
                      onClick={() => handleExportToErp(confirmExportOrder.id)}
                      style={{ opacity: confirmExportOrder.status !== 'DELIVERED' ? 0.45 : 1, cursor: confirmExportOrder.status !== 'DELIVERED' ? 'not-allowed' : undefined }}
                  >
                    {exportingId === confirmExportOrder.id ? 'Exportando...' : 'Confirmar exportación'}
                  </button>
                </div>
              </div>
          )}
        </Modal>
      </>
  )
}

function indexExports(exportsData: AdminErpExport[]) {
  return exportsData.reduce<Record<string, AdminErpExport>>((acc, item) => {
    acc[item.orderId] = item
    return acc
  }, {})
}

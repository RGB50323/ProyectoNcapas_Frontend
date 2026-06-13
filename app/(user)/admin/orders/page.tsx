import type { OrderStatus } from '@/lib/types'
import { Icon } from '@/components/Icon'
import { StatusPill } from '@/components/ui'

const PAYMENT_LABEL: Record<string, string> = {
  card: 'TARJETA',
  transfer: 'TRANSFERENCIA',
  cod: 'CONTRA ENTREGA',
}

type Row = [string, string, string, OrderStatus, number, number, string, string, string]

const ORDERS: Row[] = [
  ['KL-24218', 'Mario Sandoval', '26 may · 14:02', 'PAID', 2, 612, 'card', 'DHL-201', '—'],
  ['KL-24217', 'L. Hassan', '26 may · 12:48', 'PREPARING', 3, 1140, 'card', 'DHL-200', '—'],
  ['KL-24216', 'A. Cervantes', '26 may · 11:11', 'SHIPPED', 2, 612, 'transfer', 'DHL-199', '—'],
  ['KL-24215', 'K. Romero', '26 may · 09:36', 'DELIVERED', 1, 280, 'card', 'DHL-198', 'INV-4811'],
  ['KL-24214', 'M. Park', '25 may · 22:14', 'RETURN_REQUESTED', 1, 240, 'card', 'DHL-197', 'INV-4810'],
  ['KL-24213', 'E. Núñez', '25 may · 18:32', 'DELIVERED', 2, 420, 'cod', 'DHL-196', 'INV-4809'],
  ['KL-24212', 'J. Mendoza', '25 may · 14:18', 'DELIVERED', 1, 220, 'card', 'DHL-195', 'INV-4808'],
  ['KL-24211', 'D. Cordón', '25 may · 11:02', 'REFUNDED', 1, 320, 'card', 'DHL-194', 'INV-4807'],
]

export default function AdminOrdersPage() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
        <div>
          <div className="eyebrow accent">◇ PEDIDOS · TODOS LOS CANALES</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PEDIDOS</h1>
          <div className="mute" style={{ fontSize: 13, marginTop: 4 }}>218 totales · 12 hoy · $182,440 de ingresos en 30 días</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">CSV</button>
          <button className="btn btn-ghost">JSON</button>
          <button className="btn">XML a ERP <Icon.ArrowR /></button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        <button className="tag active">TODOS · 218</button>
        <button className="tag">NUEVOS · 4</button>
        <button className="tag">PAGADOS · 18</button>
        <button className="tag">PREPARANDO · 9</button>
        <button className="tag">ENVIADOS · 14</button>
        <button className="tag">ENTREGADOS · 162</button>
        <button className="tag">DEVOLUCIONES · 4</button>
        <button className="tag">REEMBOLSADOS · 7</button>
        <div style={{ flex: 1 }} />
        <button className="tag">TARJETA · 178</button>
        <button className="tag">TRANSFERENCIA · 22</button>
        <button className="tag">CONTRA ENTREGA · 18</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th>
              <th>Piezas</th><th>Total</th><th>Pago</th><th>Guía</th><th>Factura</th><th></th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((o, i) => (
              <tr key={i}>
                <td><span className="display" style={{ fontSize: 13 }}>{o[0]}</span></td>
                <td>{o[1]}</td>
                <td className="mono mute">{o[2]}</td>
                <td><StatusPill status={o[3]} /></td>
                <td>{o[4]}</td>
                <td><span className="display" style={{ fontSize: 14 }}>${o[5]}</span></td>
                <td><span className="mono mute" style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>{PAYMENT_LABEL[o[6]]}</span></td>
                <td className="mono mute">{o[7]}</td>
                <td className="mono mute">{o[8]}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="mono mute" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>XML</button>
                    <button className="mono mute" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>PDF</button>
                    <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>ABRIR →</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

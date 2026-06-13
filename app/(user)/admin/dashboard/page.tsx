import { getProducts } from '@/lib/api'
import { KPI } from '@/components/ui'
import { Funnel } from '@/components/dash'

export default async function AdminDashboardPage() {
  const products = await getProducts()
  const top = products.slice(0, 5)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 32 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ RESUMEN ADMIN · ÚLTIMOS 30 DÍAS</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PANEL DE OPERACIONES</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tag active">30 DÍAS</button>
          <button className="tag">90 DÍAS</button>
          <button className="tag">AÑO</button>
          <button className="btn">Exportar reporte</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="INGRESOS" value="$182,440" delta="+18.2% vs anterior" />
        <KPI label="PEDIDOS" value="218" delta="+12.1%" />
        <KPI label="TASA DE CONVERSIÓN" value="3.84%" delta="+0.42pp" />
        <KPI label="TICKET PROMEDIO" value="$836.88" delta="+5.7%" />
        <KPI label="VALOR CARRITOS ABANDONADOS" value="$28,612" delta="-3.1%" neg />
        <KPI label="TASA DE DEVOLUCIÓN" value="4.6%" delta="-1.2pp" />
        <KPI label="VENDEDORES ACTIVOS" value="08" delta="+1" />
        <KPI label="MIEMBROS K-SELECT" value="312" delta="+22" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div className="eyebrow accent">◇ EMBUDO DE CONVERSIÓN</div>
              <div className="display" style={{ fontSize: 24, marginTop: 6 }}>RECORRIDO DEL COMPRADOR</div>
            </div>
            <div className="mono mute">EVENTOS · 26.05</div>
          </div>
          <Funnel />
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div className="eyebrow accent">◇ MÁS VENDIDOS</div>
          <div className="display" style={{ fontSize: 24, marginTop: 6, marginBottom: 20 }}>MEJOR CONVERSIÓN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top.map((p, i) => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '24px 40px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div className="display" style={{ fontSize: 18, color: 'var(--text-mute)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ width: 40, height: 40, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-display)' }}>{p.name}</div>
                  <div className="mono mute">{p.brand} · ${p.price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 14 }}>{38 - i * 4} vendidos</div>
                  <div className="mono accent">{(7.2 - i * 0.6).toFixed(1)}% CR</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginTop: 24 }}>
        <div style={{ padding: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ CARRITOS ABANDONADOS · ÚLTIMAS 24H</div>
            <div className="display" style={{ fontSize: 24, marginTop: 6 }}>OPORTUNIDADES DE RECUPERACIÓN</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost">Enviar correo · 12</button>
            <button className="btn">Secuencia automática</button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th><th>Valor</th><th>Piezas</th><th>Último paso</th><th>Inactivo</th><th>Nivel</th><th></th>
            </tr>
          </thead>
          <tbody>
            {([
              ['A. Cervantes', '$612', 2, 'Pago', '2h 14m', 'VAULT'],
              ['K. Romero', '$280', 1, 'Envío', '4h 02m', 'SELECT'],
              ['L. Hassan', '$1,140', 3, 'Checkout iniciado', '8h 11m', 'VAULT'],
              ['M. Park', '$240', 1, 'Carrito', '12h 44m', '—'],
              ['E. Núñez', '$420', 2, 'Pago', '1d 03h', 'SELECT'],
            ] as [string, string, number, string, string, string][]).map((r, i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                <td><span className="display" style={{ fontSize: 14 }}>{r[1]}</span></td>
                <td>{r[2]}</td>
                <td><span className="pill yellow">{r[3]}</span></td>
                <td className="mono mute">{r[4]}</td>
                <td><span className={r[5] === 'VAULT' ? 'mono accent' : 'mono mute'}>{r[5]}</span></td>
                <td><button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>RECUPERAR →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>◆ ALERTAS DE STOCK · ACCIÓN REQUERIDA</div>
          <div className="display" style={{ fontSize: 24, marginTop: 6, marginBottom: 20 }}>11 VARIANTES BAJAS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              ['Sombra Runner 01', 'US 9.5 / Ónix', 2, 'LABWORKS'],
              ['Bóveda Alta Negra', 'US 10 / Negro', 1, 'VAULT.STD'],
              ['Lab Runner Volt', 'US 11 / Volt', 0, 'LABWORKS'],
              ['Bolso Cruzado Utility', 'Talla única / Negro', 1, 'UTILITY DIV.'],
              ['Gorra Drop Privado', 'Talla única / Negro', 2, 'K-SELECT'],
            ] as [string, string, number, string][]).map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 16, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2 }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-display)' }}>{r[0]}</div>
                  <div className="mono mute">{r[3]}</div>
                </div>
                <div className="mono">{r[1]}</div>
                <div className="mono" style={{ color: r[2] === 0 ? 'var(--danger)' : 'var(--accent-2)' }}>{r[2] === 0 ? 'AGOTADO' : `${r[2]} QUEDAN`}</div>
                <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>REPONER</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ COLA DE EXPORTACIÓN ERP</div>
          <div className="display" style={{ fontSize: 24, marginTop: 6, marginBottom: 20 }}>LISTO PARA SINCRONIZAR</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              ['Hoy · 26 may', 18, '$14,820', 'PENDIENTE'],
              ['Ayer · 25 may', 22, '$17,640', 'EXPORTADO'],
              ['24 may', 19, '$13,220', 'EXPORTADO'],
              ['23 may', 14, '$9,840', 'EXPORTADO'],
            ] as [string, number, string, string][]).map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 2, alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>{r[0]}</div>
                <div className="mono mute">{r[1]} pedidos</div>
                <div className="display" style={{ fontSize: 14 }}>{r[2]}</div>
                <span className={'pill ' + (r[3] === 'PENDIENTE' ? 'yellow' : 'green')}>{r[3]}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="mono mute" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>CSV</button>
                  <button className="mono mute" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>JSON</button>
                  <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>XML</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

import { getProducts, getCoupons } from '@/lib/api'
import { KPI } from '@/components/ui'

export default async function SellerDashboardPage() {
  const [products, coupons] = await Promise.all([getProducts(), getCoupons()])
  const myPieces = products.slice(0, 6)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
        <div>
          <div className="eyebrow accent">◇ VAULT.STD · MAYO 2026</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PANEL DE TIENDA</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">Enviar a autenticación</button>
          <button className="btn">+ Nueva pieza</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="VENTAS DEL MES" value="$28,440" delta="+22.4%" />
        <KPI label="PEDIDOS" value="32" delta="+9" />
        <KPI label="PIEZAS ACTIVAS" value="14" />
        <KPI label="POCO STOCK" value="03" neg />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div className="display" style={{ fontSize: 20 }}>MIS PIEZAS</div>
            <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>VER TODAS →</button>
          </div>
          <table className="table">
            <thead><tr><th>Pieza</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {myPieces.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</div>
                        <div className="mono mute">{p.brand}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono mute">{p.sku}</td>
                  <td><span className="display" style={{ fontSize: 13 }}>${p.price}</span></td>
                  <td>
                    {p.totalStock === 0
                      ? <span className="pill red">AGOTADO</span>
                      : p.lowStock > 0
                        ? <span className="pill yellow">BAJO · {p.totalStock}</span>
                        : <span className="pill green">EN STOCK · {p.totalStock}</span>}
                  </td>
                  <td>
                    {p.privateDrop && <span className="badge private">PRIVADO</span>}
                    {!p.privateDrop && p.limited && <span className="badge limited">LIMITADO</span>}
                    {!p.privateDrop && !p.limited && <span className="mono mute">PUBLICADO</span>}
                  </td>
                  <td><button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>EDITAR</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ POR PREPARAR · 6 PENDIENTES</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>NUEVOS PEDIDOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['KL-24218', 'Mario S.', 'Sombra Runner 01', 'US 9', '$240'],
              ['KL-24217', 'L. Hassan', 'Bóveda Alta Negra', 'US 10', '$410'],
              ['KL-24216', 'A. Cervantes', 'Lab Runner Volt', 'US 11', '$220'],
              ['KL-24215', 'K. Romero', 'Court Crema Baja', 'US 8.5', '$195'],
            ] as [string, string, string, string, string][]).map((o, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="display" style={{ fontSize: 13 }}>{o[0]}</span>
                  <span className="mono accent">{o[4]}</span>
                </div>
                <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>{o[2]} · {o[3]}</div>
                <div className="mono mute" style={{ marginTop: 2 }}>PARA {o[1].toUpperCase()}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 11 }}>Marcar preparado</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>Imprimir guía</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>◆ ALERTAS DE STOCK</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>REPONER PRONTO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              ['Bóveda Alta Negra · US 10', 1],
              ['Sombra Runner 01 · US 9.5', 2],
              ['Court Crema Baja · US 11', 0],
            ] as [string, number][]).map((r, i) => (
              <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>{r[0]}</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="mono" style={{ color: r[1] === 0 ? 'var(--danger)' : 'var(--accent-2)' }}>{r[1] === 0 ? 'AGOTADO' : `${r[1]} QUEDAN`}</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Reponer</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow accent">◇ MIS PROMOCIONES</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>CUPONES ACTIVOS</div>
          {coupons.map((c) => (
            <div key={c.code} style={{ padding: 12, border: '1px solid var(--border)', marginBottom: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
              <div>
                <div className="display" style={{ fontSize: 14 }}>{c.code}</div>
                <div className="mono mute" style={{ marginTop: 2 }}>{c.label}</div>
              </div>
              <div className="mono mute">{c.uses}/{c.max} usos</div>
              <span className={'pill ' + (c.active ? 'green' : 'gray')}>{c.active ? 'ACTIVO' : 'PAUSADO'}</span>
              <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>EDITAR</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

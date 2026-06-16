import Link from 'next/link'
import { getDrops } from '@/lib/api'
import { Icon } from '@/components/Icon'

export default async function DropsPage() {
  const drops = await getDrops()
  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Drops</em></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ CALENDARIO DEL LAB · EN VIVO</div>
          <h1 className="display" style={{ fontSize: 80, marginTop: 12, lineHeight: 0.9 }}>CALENDARIO<br />DE DROPS</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tag active">PRÓXIMOS</button>
          <button className="tag">PASADOS</button>
          <button className="tag">SOLO PRIVADOS</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)' }}>
        {drops.map((d, i) => {
          const [day, time] = d.date.split('·')
          const isPrivate = d.type === 'DROP PRIVADO'
          const dayLabel = (day ?? '').trim()
          const timeLabel = (time ?? '').trim()
          return (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '200px 280px 1fr auto', gap: 32, padding: 32, borderBottom: i < drops.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
              <div>
                <div className="mono accent" style={{ letterSpacing: '0.14em' }}>{dayLabel}</div>
                <div className="display" style={{ fontSize: 32, marginTop: 4, color: 'var(--accent-2)' }}>{timeLabel}</div>
                <div className="mono mute" style={{ marginTop: 4 }}>GMT</div>
              </div>
              <div style={{ aspectRatio: '4/3', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <img src={d.img} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span className={'badge ' + (isPrivate ? 'private' : '')}>{d.type}</span>
                  <span className="badge">{d.units} UNIDADES</span>
                </div>
                <h3 className="display" style={{ fontSize: 36, lineHeight: 1 }}>{d.title}</h3>
                <p className="mute" style={{ marginTop: 12, fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>
                  {isPrivate
                    ? 'Lanzamiento miembros primero. Requiere nivel K-Select. Actívate para entrar en la fila.'
                    : 'Lanzamiento público. Primero en llegar, primero en asegurar. Pon un recordatorio para entrar al laboratorio a tiempo.'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                <button className="btn">Avísame <Icon.ArrowR /></button>
                <button className="btn btn-ghost">Agregar al calendario</button>
                {i === 0 && <div className="mono accent" style={{ textAlign: 'center', padding: 8, border: '1px dashed var(--accent)', marginTop: 8 }}>4,128 NOTIFICADOS</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 64, padding: 48, background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div className="eyebrow accent">◆ MEMBRESÍA K-SELECT</div>
          <h2 className="display" style={{ fontSize: 56, marginTop: 12, lineHeight: 0.95 }}>PRIMER<br />ACCESO A<br />LA BÓVEDA.</h2>
        </div>
        <div>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 24 }}>Los miembros K-Select reciben drops privados 48 horas antes del público, prioridad en archivo y línea directa con el equipo de curaduría de Mister K. Por invitación o solicitud.</p>
          <button className="btn btn-lg">Solicitar K-Select <Icon.ArrowR /></button>
        </div>
      </div>
    </div>
  )
}

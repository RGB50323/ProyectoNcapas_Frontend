export default function TrustBanner() {
  const items: [string, string, string][] = [
    ['01', '100% LEGÍTIMO', 'Autenticado en laboratorio'],
    ['02', 'PAGO SEGURO', 'Cifrado de extremo a extremo'],
    ['03', 'ENVÍO GLOBAL', 'Rastreado y asegurado'],
    ['04', 'SEDE BOUTIQUE', 'San Salvador · CA'],
  ]

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
    <div className="container" style={{ display: 'flex', alignItems: 'stretch', padding: 0 }}>
      <div style={{
        background: 'var(--text)',
        color: 'var(--bg-0)',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        flexShrink: 0,
        minWidth: 172,
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>◆ ESTÁNDAR</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>K LAB</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1 }}>
        {items.map(([n, t, s]) => (
          <div key={n} style={{ padding: '28px 32px', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text)', lineHeight: 1 }}>{t}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}

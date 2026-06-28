import Link from 'next/link'

const SECTIONS: [string, string][] = [
  ['Aceptación de los términos', 'Al usar K LAB by Mister K aceptás estos términos. Si no estás de acuerdo, no utilices la plataforma.'],
  ['Tu cuenta', 'Sos responsable de mantener la confidencialidad de tu cuenta y de la actividad que ocurra en ella. Los datos que registrás deben ser verídicos.'],
  ['Compras y pagos', 'Los precios están en USD e incluyen impuestos cuando aplica. Una compra se confirma cuando se procesa el pago. Nos reservamos el derecho de cancelar pedidos con datos incorrectos o sin stock.'],
  ['Autenticación, envíos y devoluciones', 'Cada pieza pasa por nuestro protocolo de autenticación antes de enviarse. Los métodos y tiempos de envío se muestran al pagar. Aceptamos devoluciones de piezas sin uso según la política vigente.'],
  ['Propiedad intelectual', 'Las marcas, textos e imágenes del sitio pertenecen a K LAB o a sus respectivos dueños. No está permitido reproducirlos sin autorización.'],
  ['Contacto', 'Para consultas sobre estos términos escribinos a soporte@klab.studio. K LAB by Mister K · San Salvador, El Salvador.'],
]

export default function TermsPage() {
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Términos</em></div>
      <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LEGAL</div>
      <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginTop: 12 }}>TÉRMINOS Y CONDICIONES</h1>
      <p className="mono mute" style={{ marginTop: 12, fontSize: 12 }}>ÚLTIMA ACTUALIZACIÓN · 2026</p>

      <div style={{ marginTop: 48 }}>
        {SECTIONS.map(([title, body], i) => (
          <section key={title} style={{ padding: '28px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 20, alignItems: 'start' }}>
              <div className="display" style={{ fontSize: 18, color: 'var(--text-mute)' }}>{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h2 className="display" style={{ fontSize: 20, marginBottom: 12 }}>{title}</h2>
                <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{body}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

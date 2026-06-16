import Link from 'next/link'

const SECTIONS: [string, string][] = [
  ['Información que recopilamos', 'Recopilamos los datos que nos das al crear tu cuenta y comprar: nombre, correo, teléfono, direcciones de envío e historial de pedidos. También guardamos información técnica básica para que el sitio funcione (sesión y carrito).'],
  ['Cómo usamos tu información', 'Usamos tus datos para procesar pedidos, gestionar envíos y devoluciones, autenticar tu cuenta y mejorar la experiencia de compra. No vendemos tu información a terceros.'],
  ['Almacenamiento y seguridad', 'Tus credenciales se guardan cifradas y la sesión viaja por token. Conservamos tus datos mientras tu cuenta esté activa o mientras sea necesario para cumplir obligaciones legales.'],
  ['Tus derechos', 'Podés ver y editar tu información desde tu cuenta, actualizar tus direcciones o solicitar la eliminación de tu cuenta. Escribinos para cualquier solicitud relacionada con tus datos.'],
  ['Contacto', 'Para temas de privacidad escribinos a privacidad@klab.studio. K LAB by Mister K · San Salvador, El Salvador.'],
]

export default function PrivacyPage() {
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Privacidad</em></div>
      <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ LEGAL</div>
      <h1 className="display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginTop: 12 }}>POLÍTICA DE PRIVACIDAD</h1>
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

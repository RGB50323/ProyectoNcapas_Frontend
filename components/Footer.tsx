import Link from 'next/link'

export default function Footer() {
  return (
    <div className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img
              src="/logo.png"
              alt="Mister K"
              style={{ height: 40, width: 'auto', filter: 'invert(1) sepia(0.12)', mixBlendMode: 'screen', display: 'block', marginBottom: 20 }}
            />
            <p style={{ color: 'var(--text-dim)', fontSize: 13, maxWidth: 300, lineHeight: 1.65, margin: 0 }}>
              Curado. Certificado. Tuyo.<br />Del laboratorio a tu rotación.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-2)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 16, marginBottom: 0 }}>
              @misterk_oficial
            </p>
          </div>

          <div className="footer-col">
            <h4>Tienda</h4>
            <Link href="/catalog">Catálogo</Link>
            <Link href="/drops">Drops</Link>
            <Link href="/catalog?chip=K-SELECT">K·Select</Link>
            <Link href="/catalog?chip=ARCHIVO">Archivo</Link>
            <Link href="/compare">Comparar</Link>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacidad</Link>
            <Link href="/terms">Términos</Link>
          </div>

          <div className="footer-col">
            <h4>Sede del Lab</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0, lineHeight: 1.65 }}>
              Calle La Reforma 4012<br />
              San Salvador, El Salvador
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 K LAB BY MISTER K. TODOS LOS DERECHOS RESERVADOS.</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/privacy">Privacidad</Link>
            <Link href="/terms">Términos</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

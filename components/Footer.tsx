export default function Footer() {
  return (
    <div className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
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
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 10 }}>
                MANTENTE EN LA ROTACIÓN
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@correo.com"
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button className="btn" style={{ flexShrink: 0, paddingLeft: 20, paddingRight: 20 }}>→</button>
              </div>
            </div>
          </div>

          <div className="footer-col">
            <h4>Tienda</h4>
            <a>Tenis</a>
            <a>Ropa urbana</a>
            <a>Sudaderas</a>
            <a>Camisetas</a>
            <a>Gorras</a>
            <a>Accesorios</a>
            <a>Archivo</a>
          </div>

          <div className="footer-col">
            <h4>El Laboratorio</h4>
            <a>Sobre K LAB</a>
            <a>Autenticación</a>
            <a>Mister K</a>
            <a>K-Select</a>
            <a>Prensa</a>
          </div>

          <div className="footer-col">
            <h4>Soporte</h4>
            <a>Envíos</a>
            <a>Devoluciones</a>
            <a>Tallas</a>
            <a>Preguntas frecuentes</a>
            <a>Contacto</a>
          </div>

          <div className="footer-col">
            <h4>Sede del Lab</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0, lineHeight: 1.65 }}>
              Calle La Reforma 4012<br />
              San Salvador, El Salvador<br />
              Lun–Sáb · 11:00–20:00
            </p>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 6 }}>ABIERTO HOY</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>11:00 — 20:00</div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 K LAB BY MISTER K. TODOS LOS DERECHOS RESERVADOS.</div>
          <div>Privacidad · Términos · Mapa del sitio</div>
        </div>
San Salvador, El Salvador
Lun–Sáb · 11:00–20:00

ABIERTO HOY
11:00 — 20:00
      </div>
    </div>
  )
}

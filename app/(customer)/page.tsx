import Link from 'next/link'
import { getProducts } from '@/lib/api'
import { stripeImg } from '@/lib/mock-data'
import type { Product } from '@/lib/types'
import { Icon } from '@/components/Icon'
import ProductCard from '@/components/ProductCard'
import TrustBanner from '@/components/TrustBanner'
import HeroCarousel, { type HeroSlide } from '@/components/HeroCarousel'

/* ─── Editorial split (2-up) ─── */
function SplitPanel({ left, right }: {
  left: { image: string; eyebrow: string; title: string; cta: string; href: string }
  right: { image: string; eyebrow: string; title: string; cta: string; href: string }
}) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
      {[left, right].map((p, i) => (
        <Link key={i} href={p.href} style={{
          display: 'block', position: 'relative',
          minHeight: '62vh', overflow: 'hidden',
          borderRight: i === 0 ? '1px solid var(--border)' : 'none',
        }}>
          <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, oklch(0.118 0.012 62 / 0.88) 0%, transparent 55%)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '40px 36px',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{p.eyebrow}</div>
            <div className="display" style={{ fontSize: 'clamp(28px, 3.5vw, 52px)', lineHeight: 0.92, color: 'var(--text)' }}>{p.title}</div>
            <span className="btn btn-ghost" style={{ marginTop: 20, display: 'inline-flex', fontSize: 12, alignSelf: 'flex-start' }}>
              {p.cta}
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}

/* ─── 3-column portrait blocks ─── */
function ThreeUp({ items }: { items: Array<{ image: string; label: string; href: string }> }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--border)' }}>
      {items.map((item, i) => (
        <Link key={item.label} href={item.href} style={{
          display: 'block', position: 'relative',
          minHeight: '70vh', overflow: 'hidden',
          borderRight: i < 2 ? '1px solid var(--border)' : 'none',
        }}>
          <img src={item.image} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, oklch(0.118 0.012 62 / 0.82) 0%, transparent 50%)',
          }} />
          <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
            <div className="display" style={{ fontSize: 'clamp(22px, 2.5vw, 40px)', lineHeight: 0.95, color: 'var(--text)' }}>{item.label}</div>
            <span className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-flex', fontSize: 12 }}>
              Ver colección
            </span>
          </div>
        </Link>
      ))}
    </section>
  )
}

/* ─── Product section ─── */
function HomeSection({ title, eyebrow, meta, products }: {
  title: string; eyebrow: string; meta: string; products: Product[]
}) {
  return (
    <section style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ paddingTop: 64, paddingBottom: 72 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
            <div className="display" style={{ fontSize: 'clamp(30px, 3.5vw, 48px)', lineHeight: 0.9 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <span className="mono mute">{meta}</span>
            <Link href="/catalog" className="btn btn-ghost">Ver todo <Icon.ArrowR /></Link>
          </div>
        </div>
        <div className="grid-products">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── Editorial block ─── */
function EditorialBlock() {
  return (
    <section style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 16 }}>◇ EL MÉTODO</div>
            <h2 className="display" style={{ fontSize: 'clamp(52px, 6vw, 88px)', lineHeight: 0.9 }}>
              NO TODO<br />ENTRA AL<br />LABORATORIO.
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: 15, lineHeight: 1.75, maxWidth: 460, marginTop: 28 }}>
              Cada pieza pasa por un protocolo de autenticación de cuatro etapas. Materiales, construcción, código de fábrica e inspección final de Mister K. Si falla, no se envía.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 36, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {['01 / MATERIAL', '02 / CONSTRUCCIÓN', '03 / CÓDIGO', '04 / K'].map((s, i) => (
                <div key={s} style={{ padding: '16px 0', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
                  <div className="mono" style={{ color: 'var(--text-mute)', letterSpacing: '0.14em', fontSize: 11 }}>{s}</div>
                </div>
              ))}
            </div>
            <Link href="/catalog" className="btn btn-ghost" style={{ marginTop: 32 }}>Ver catálogo verificado <Icon.ArrowR /></Link>
          </div>
          <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={stripeImg('LAB_PROCESS', '#2a2420', '#1e1a16')} alt="Proceso del laboratorio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, padding: 20, background: 'var(--bg-0)', border: '1px solid var(--border)' }}>
              <div className="mono mute">PIEZA VERIFICADA / MUESTRA</div>
              <div className="display" style={{ fontSize: 18, marginTop: 6 }}>CERTIFICADO DE AUTENTICIDAD</div>
              <div className="mono mute" style={{ marginTop: 8 }}>SERIAL: KL-AUTH-2026-04812</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Page ─── */
export default async function HomePage() {
  const products = await getProducts()

  const slides: HeroSlide[] = [
    {
      id: 's1',
      image: '/hero/nude-project.png',
      objectPosition: 'center 35%',
      eyebrow: '◆ NUEVO INGRESO · STREETWEAR',
      headline: 'NUDE\nPROJECT.',
      sub: 'Camisetas de edición limitada. Gráficos curados, calidad premium. Certificadas y listas para tu rotación.',
      cta: 'Ver colección',
      href: '/catalog',
    },
    {
      id: 's2',
      image: '/hero/slide2.png',
      objectPosition: 'center 55%',
      eyebrow: '◇ TENIS · MAISON MIHARA YASUHIRO',
      headline: 'SKELETON\nLOW.',
      sub: 'Dos colorways del Blakey OG Low: azul denim y negro total. Construcción artesanal, autenticidad certificada.',
      cta: 'Ver tenis',
      href: '/catalog',
    },
    {
      id: 's3',
      image: '/hero/slide3.png',
      objectPosition: 'center center',
      eyebrow: '◆ COLLAB · TRAVIS SCOTT × JORDAN',
      headline: 'AJ1 LOW\nOLIVE.',
      sub: 'Air Jordan 1 Low OG Travis Scott en colorway Olive/Sail. Certificado K LAB. Stock limitado.',
      cta: 'Ver drop',
      href: '/catalog',
    },
    {
      id: 's4',
      image: '/hero/barca-cactus.png',
      objectPosition: 'center 25%',
      eyebrow: '◇ K·SELECT · ACCESO EXCLUSIVO',
      headline: 'CACTUS\nJACK ×\nBARÇA.',
      sub: 'Collab icónica. Camiseta del FC Barcelona × Travis Scott. Solo para los que saben.',
      cta: 'K·Select',
      href: '/catalog',
    },
  ]

  const newArrivals = products.filter((p) => p.privateDrop || p.limited).slice(0, 4)
  const select = products.filter((p) => p.featured).slice(0, 4)
  const archive = products.filter((p) => p.condition.startsWith('PRE_OWNED')).slice(0, 4)

  return (
    <>
      <HeroCarousel slides={slides} />

      <SplitPanel
        left={{
          image: '/hero/slide3.png',
          eyebrow: '◇ DROPS · COLLAB',
          title: 'DROPS',
          cta: 'Ver drops',
          href: '/drops',
        }}
        right={{
          image: '/hero/slide4.png',
          eyebrow: '◆ SELECCIÓN K',
          title: 'K·SELECT',
          cta: 'Ver selección',
          href: '/catalog',
        }}
      />

      <ThreeUp items={[
        { image: '/hero/slide2.png', label: 'TENIS', href: '/catalog' },
        { image: '/hero/slide1.png', label: 'STREETWEAR', href: '/catalog' },
        { image: '/hero/gorras.png', label: 'GORRAS', href: '/catalog' },
      ]} />

      <HomeSection
        eyebrow="◇ NUEVOS INGRESOS"
        title="NUEVOS INGRESOS"
        meta="04 PIEZAS · ESTA SEMANA"
        products={newArrivals}
      />

      <HomeSection
        eyebrow="◇ SELECCIÓN K"
        title="SELECCIÓN K"
        meta="ELEGIDOS A MANO · SEM. 22"
        products={select}
      />

      <EditorialBlock />

      <HomeSection
        eyebrow="◆ PIEZAS SEMINUEVAS · CONDICIÓN CALIFICADA"
        title="ARCHIVO"
        meta="VERIFICADAS · CALIFICADAS 8.0+"
        products={archive}
      />

      <TrustBanner />
    </>
  )
}

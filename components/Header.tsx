'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from './Icon'
import { useAuth } from '@/lib/auth'

const NAV: [string, string][] = [
  ['Inicio', '/'],
  ['Catálogo', '/catalog'],
  ['Drops', '/drops'],
  ['K·Select', '/catalog'],
  ['Comparar', '/compare'],
]

export default function Header({ cartCount = 0, wishCount = 0 }: { cartCount?: number; wishCount?: number }) {
  const pathname = usePathname()
  const { session, loading } = useAuth()

  return (
    <div className="header">
      <div className="header-inner">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Mister K"
            style={{ height: 34, width: 'auto', filter: 'invert(1) sepia(0.12)', mixBlendMode: 'screen', display: 'block' }}
          />
        </Link>
        <nav className="nav-main">
          {NAV.map(([label, href]) => (
            <Link key={label} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
          ))}
          {session && (
            <Link href="/account" className={pathname === '/account' ? 'active' : ''}>Cuenta</Link>
          )}
        </nav>
        <div className="header-right">
          <button className="icon-btn" title="Buscar" aria-label="Buscar"><Icon.Search /></button>
          {!loading && session && (
            <>
              <Link href="/account" className="icon-btn" title="Favoritos" aria-label="Favoritos">
                <Icon.Heart />
                {wishCount > 0 && <span className="bubble">{wishCount}</span>}
              </Link>
              <Link href="/account" className="icon-btn" title="Cuenta" aria-label="Cuenta"><Icon.User /></Link>
              <Link href="/cart" className="icon-btn" title="Bolsa" aria-label="Bolsa">
                <Icon.Bag />
                {cartCount > 0 && <span className="bubble">{cartCount}</span>}
              </Link>
            </>
          )}
          {!loading && !session && (
            <Link
              href="/login"
              className="mono"
              style={{
                textTransform: 'uppercase',
                color: pathname === '/login' ? 'var(--text)' : 'var(--text-dim)',
                border: '1px solid var(--border-bright)',
                padding: '8px 14px',
                whiteSpace: 'nowrap',
              }}
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

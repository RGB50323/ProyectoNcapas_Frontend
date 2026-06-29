'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '@/lib/auth'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import SearchOverlay from './SearchOverlay'

const NAV: [string, string][] = [
  ['Inicio', '/'],
  ['Catálogo', '/catalog'],
  ['Drops', '/drops'],
  ['K·Select', '/catalog?chip=K-SELECT'],
  ['Comparar', '/compare'],
]

const logoStyle = { height: 34, width: 'auto', filter: 'invert(1) sepia(0.12)', mixBlendMode: 'screen', display: 'block' } as const

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { count: wishCount } = useWishlist()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = session?.role === 'ADMIN'
  const isSeller = session?.role === 'SELLER'
  const isConsole = isAdmin || isSeller
  const homeHref = isAdmin ? '/admin/dashboard' : isSeller ? '/seller/dashboard' : '/'

  const closeMenu = () => setMenuOpen(false)

  // lock body scroll + Escape while overlay is open
  useEffect(() => {
    if (!menuOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <div className="header">
      <div className="header-inner">
        <div className="header-left">
          {!isConsole && (
            <button className="nav-toggle" aria-label="Menú" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
          )}
          <Link href={homeHref} className={`header-logo-left${isConsole ? '' : ' hide-mobile'}`} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <img src="/logo.png" alt="Mister K" style={logoStyle} />
          </Link>
        </div>

        <div className="header-center">
          <nav className="nav-main">
            {isConsole ? (
              <span className="mono mute" style={{ letterSpacing: '0.18em' }}>
                {isAdmin ? 'CONSOLA · ADMINISTRACIÓN' : 'CONSOLA · VENDEDOR'}
              </span>
            ) : (
              NAV.map(([label, href]) => (
                <Link key={label} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
              ))
            )}
          </nav>
          {!isConsole && (
            <Link href={homeHref} className="header-logo-center" style={{ alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <img src="/logo.png" alt="Mister K" style={logoStyle} />
            </Link>
          )}
        </div>

        <div className="header-right">
          {isConsole ? (
            <button
              className="mono"
              onClick={async () => { await logout(); router.replace('/login') }}
              style={{ textTransform: 'uppercase', color: 'var(--text-dim)', background: 'none', border: '1px solid var(--border-bright)', padding: '8px 14px', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <button className="icon-btn" title="Buscar" aria-label="Buscar" onClick={() => setSearchOpen(true)}>
                <Icon.Search />
              </button>
              {!loading && session && (
                <>
                  <Link href="/account?tab=wishlist" className="icon-btn" title="Favoritos" aria-label="Favoritos">
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
            </>
          )}
          {!loading && !session && (
            <Link
              href="/login"
              className="mono header-login"
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

      {!isConsole && menuOpen && (
        <>
          <button className="mobile-overlay-backdrop" aria-label="Cerrar menú" onClick={closeMenu} />
          <div className="mobile-overlay" role="dialog" aria-modal="true" aria-label="Menú principal">
            <div className="mobile-overlay-top">
              <span>Menú</span>
              <button className="icon-btn" aria-label="Cerrar menú" onClick={closeMenu}><Icon.Close /></button>
            </div>

            <nav className="mobile-overlay-nav" aria-label="Navegación principal">
              <div className="mobile-overlay-group">Explorar</div>
              {NAV.map(([label, href]) => (
                <Link key={label} href={href} className={pathname === href ? 'active' : ''} onClick={closeMenu}>{label}</Link>
              ))}
            </nav>

            {!loading && session ? (
              <div className="mobile-overlay-account">
                <div className="mobile-overlay-group">Cuenta</div>
                <Link href="/account?tab=wishlist" onClick={closeMenu}>Favoritos</Link>
                <Link href="/account" className={pathname === '/account' ? 'active' : ''} onClick={closeMenu}>Cuenta</Link>
                <Link href="/cart" className={pathname === '/cart' ? 'active' : ''} onClick={closeMenu}>Bolsa</Link>
                <button onClick={async () => { closeMenu(); await logout(); router.replace('/') }}>Cerrar sesión</button>
              </div>
            ) : !loading && (
              <div className="mobile-overlay-account">
                <div className="mobile-overlay-group">Cuenta</div>
                <Link href="/login" className={pathname === '/login' ? 'active' : ''} onClick={closeMenu}>Iniciar sesión</Link>
              </div>
            )}
          </div>
        </>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

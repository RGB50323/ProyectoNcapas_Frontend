'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { session, loading, logout } = useAuth()
  const { count: cartCount } = useCart()
  const { count: wishCount } = useWishlist()
  const [searchOpen, setSearchOpen] = useState(false)
  const isAdmin = session?.role === 'ADMIN'
  const isSeller = session?.role === 'SELLER'
  const isConsole = isAdmin || isSeller
  const homeHref = isAdmin ? '/admin/dashboard' : isSeller ? '/seller/dashboard' : '/'

  return (
    <div className="header">
      <div className="header-inner">
        <Link href={homeHref} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Mister K"
            style={{ height: 34, width: 'auto', filter: 'invert(1) sepia(0.12)', mixBlendMode: 'screen', display: 'block' }}
          />
        </Link>
        <nav className="nav-main">
          {isConsole ? (
            <span className="mono mute" style={{ letterSpacing: '0.18em' }}>
              {isAdmin ? 'CONSOLA · ADMINISTRACIÓN' : 'CONSOLA · VENDEDOR'}
            </span>
          ) : (
            <>
              {NAV.map(([label, href]) => (
                <Link key={label} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
              ))}
            </>
          )}
        </nav>
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
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

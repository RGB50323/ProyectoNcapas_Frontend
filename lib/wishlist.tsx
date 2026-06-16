'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { getWishlist, addWishlist, removeWishlist } from './shop'
import type { WishlistItem } from './types'

interface WishlistContextValue {
  items: WishlistItem[]
  count: number
  has: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
  refresh: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const isBuyer = session?.role === 'BUYER'
  const [items, setItems] = useState<WishlistItem[]>([])

  const refresh = useCallback(async () => {
    if (!session || !isBuyer) {
      setItems([])
      return
    }
    try {
      setItems(await getWishlist(session))
    } catch {
      setItems([])
    }
  }, [session, isBuyer])

  useEffect(() => {
    refresh()
  }, [refresh])

  const has = (productId: string) => items.some((w) => w.productId === productId)

  const toggle: WishlistContextValue['toggle'] = async (productId) => {
    if (!session) throw new Error('Inicia sesión como comprador para guardar favoritos.')
    if (!isBuyer) throw new Error('Solo los compradores pueden usar favoritos.')
    const existing = items.find((w) => w.productId === productId)
    if (existing) await removeWishlist(session, existing.id)
    else await addWishlist(session, productId)
    await refresh()
  }

  return (
    <WishlistContext.Provider value={{ items, count: items.length, has, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist debe usarse dentro de <WishlistProvider>')
  return ctx
}

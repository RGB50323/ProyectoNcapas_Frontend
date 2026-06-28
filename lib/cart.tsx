'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { getCart, addCartItem, updateCartItem, removeCartItem } from './shop'
import type { CartItem } from './types'

const COUPON_KEY = 'klab_coupon'

interface CartContextValue {
  items: CartItem[]
  count: number
  loading: boolean
  coupon: string | null
  setCoupon: (code: string | null) => void
  add: (productId: string, variantId: string, quantity?: number) => Promise<void>
  update: (id: string, quantity: number) => Promise<void>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const isBuyer = session?.role === 'BUYER'
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [coupon, setCouponState] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(COUPON_KEY)
    if (saved) setCouponState(saved)
  }, [])

  const setCoupon = useCallback((code: string | null) => {
    setCouponState(code)
    if (code) localStorage.setItem(COUPON_KEY, code)
    else localStorage.removeItem(COUPON_KEY)
  }, [])

  const refresh = useCallback(async () => {
    if (!session || !isBuyer) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      setItems(await getCart(session))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [session, isBuyer])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add: CartContextValue['add'] = async (productId, variantId, quantity = 1) => {
    if (!session) throw new Error('Inicia sesión como comprador para agregar a la bolsa.')
    if (!isBuyer) throw new Error('Solo los compradores pueden usar la bolsa.')
    await addCartItem(session, { productId, variantId, quantity })
    await refresh()
  }

  const update: CartContextValue['update'] = async (id, quantity) => {
    if (!session) return
    await updateCartItem(session, id, quantity)
    await refresh()
  }

  const remove: CartContextValue['remove'] = async (id) => {
    if (!session) return
    await removeCartItem(session, id)
    await refresh()
  }

  const count = items.reduce((sum, it) => sum + it.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, loading, coupon, setCoupon, add, update, remove, refresh }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}

import { authFetch, type Session } from './auth'
import type { CartItem, WishlistItem, CouponPreview } from './types'

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = json?.message
    if (typeof msg === 'string') throw new Error(msg)
    if (msg && typeof msg === 'object') throw new Error(Object.values(msg).join('. '))
    throw new Error(`Error ${res.status}`)
  }
  return json?.data as T
}

export async function getCart(session: Session): Promise<CartItem[]> {
  return unwrap<CartItem[]>(await authFetch('/cart-items/', session))
}

export async function addCartItem(
    session: Session,
    body: { productId: string; variantId: string; quantity: number }
): Promise<CartItem> {
  return unwrap<CartItem>(
      await authFetch('/cart-items/create', session, { method: 'POST', body: JSON.stringify(body) })
  )
}

export async function updateCartItem(session: Session, id: string, quantity: number): Promise<CartItem> {
  return unwrap<CartItem>(
      await authFetch(`/cart-items/update/${id}`, session, { method: 'PUT', body: JSON.stringify({ quantity }) })
  )
}

export async function removeCartItem(session: Session, id: string): Promise<void> {
  await unwrap<unknown>(await authFetch(`/cart-items/${id}`, session, { method: 'DELETE' }))
}

export async function clearCart(session: Session): Promise<void> {
  const items = await getCart(session)
  await Promise.all(items.map((item) => removeCartItem(session, item.id)))
}

export async function getWishlist(session: Session): Promise<WishlistItem[]> {
  return unwrap<WishlistItem[]>(await authFetch('/wishlist/', session))
}

export async function addWishlist(session: Session, productId: string): Promise<WishlistItem> {
  return unwrap<WishlistItem>(
      await authFetch('/wishlist/create', session, { method: 'POST', body: JSON.stringify({ productId }) })
  )
}

export async function removeWishlist(session: Session, id: string): Promise<void> {
  await unwrap<unknown>(await authFetch(`/wishlist/${id}`, session, { method: 'DELETE' }))
}

export async function previewCoupon(
    session: Session,
    body: { code: string; shippingMethodId?: string }
): Promise<CouponPreview> {
  return unwrap<CouponPreview>(
      await authFetch('/coupons/preview', session, { method: 'POST', body: JSON.stringify(body) })
  )
}
import { authFetch, getUserId, type Session } from './auth'
import type { AdminSeller, AdminOrder, AdminOrderItem } from './admin'

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

export async function getMySellerProfile(session: Session): Promise<AdminSeller | null> {
  const all = await unwrap<AdminSeller[]>(await authFetch('/seller_profiles/', session))
  const uid = getUserId(session)
  return all.find((s) => s.user.uuid === uid) ?? null
}

export async function orderItemsBySeller(session: Session, sellerId: string): Promise<AdminOrderItem[]> {
  return unwrap<AdminOrderItem[]>(await authFetch(`/order-items/seller/${sellerId}`, session))
}

export async function getOrder(session: Session, orderId: string): Promise<AdminOrder> {
  return unwrap<AdminOrder>(await authFetch(`/orders/${orderId}`, session))
}

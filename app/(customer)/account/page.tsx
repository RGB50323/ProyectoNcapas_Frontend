import { getOrders, getProducts } from '@/lib/api'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const [orders, products] = await Promise.all([getOrders(), getProducts()])
  const wishlist = products.slice(2, 8)
  return <AccountClient orders={orders} wishlist={wishlist} />
}

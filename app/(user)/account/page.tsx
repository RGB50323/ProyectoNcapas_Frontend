import { getOrders, getProducts } from '@/lib/api'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const [orders, products] = await Promise.all([getOrders(), getProducts()])
  return <AccountClient orders={orders} products={products} />
}

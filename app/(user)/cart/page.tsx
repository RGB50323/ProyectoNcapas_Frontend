import { getPublicProducts, getShippingMethods } from '@/lib/api'
import CartClient from './CartClient'

export default async function CartPage() {
  const [products, shipping] = await Promise.all([
    getPublicProducts(), getShippingMethods(),
  ])
  return <CartClient products={products} shipping={shipping} />
}

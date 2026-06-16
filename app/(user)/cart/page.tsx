import { getProducts, getShippingMethods } from '@/lib/api'
import CartClient from './CartClient'

export default async function CartPage() {
  const [products, shipping] = await Promise.all([
    getProducts(), getShippingMethods(),
  ])
  return <CartClient products={products} shipping={shipping} />
}

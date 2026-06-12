import { getProducts, getShippingMethods, getCoupons } from '@/lib/api'
import CartClient from './CartClient'

export default async function CartPage() {
  const [products, shipping, coupons] = await Promise.all([
    getProducts(), getShippingMethods(), getCoupons(),
  ])
  return <CartClient products={products} shipping={shipping} coupons={coupons} />
}

import { getProducts, getShippingMethods } from '@/lib/api'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  const [products, shipping] = await Promise.all([getProducts(), getShippingMethods()])
  return <CheckoutClient products={products} shipping={shipping} />
}

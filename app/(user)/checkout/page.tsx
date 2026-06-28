import { getShippingMethods } from '@/lib/api'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage() {
  const shipping = await getShippingMethods().catch(() => [])
  return <CheckoutClient shipping={shipping} />
}
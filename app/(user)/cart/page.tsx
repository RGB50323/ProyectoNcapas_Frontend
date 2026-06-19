import { getPublicProducts } from '@/lib/api'
import CartClient from './CartClient'

export default async function CartPage() {
  const products = await getPublicProducts()
  return <CartClient products={products} />
}

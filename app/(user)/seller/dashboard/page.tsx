import { getProducts, getCoupons } from '@/lib/api'
import SellerDashboardClient from './SellerDashboardClient'

export default async function SellerDashboardPage() {
  const [products, coupons] = await Promise.all([
    getProducts(),
    getCoupons(),
  ])

  return (
    <SellerDashboardClient
      products={products}
      coupons={coupons}
    />
  )
}
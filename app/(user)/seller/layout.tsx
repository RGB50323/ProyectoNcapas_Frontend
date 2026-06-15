import { SellerSidebar } from '@/components/dash'
import { getProducts } from '@/lib/api'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const products = await getProducts()

  const totalProducts = products.length
  const soldOut = products.filter((p) => p.soldOut).length
  const stockAlerts = products.filter((p) => p.lowStock > 0 || p.soldOut).length
  const pendingAuth = products.filter((p) => p.auth === 'PENDING').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SellerSidebar
        totalProducts={totalProducts}
        soldOut={soldOut}
        stockAlerts={stockAlerts}
        pendingAuth={pendingAuth}
        drafts={0}
      />
      <div className="dash-main" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
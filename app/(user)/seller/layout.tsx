import { SellerSidebar } from '@/components/dash'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SellerSidebar />
      <div className="dash-main" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
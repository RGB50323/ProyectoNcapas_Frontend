import { DashHeader, SellerSidebar } from '@/components/dash'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashHeader role="VENDEDOR" name="VAULT.STD · 14 piezas activas" />
      <div className="dash-shell">
        <SellerSidebar />
        <div className="dash-main">{children}</div>
      </div>
    </div>
  )
}

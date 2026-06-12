import { DashHeader, AdminSidebar } from '@/components/dash'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashHeader role="ADMIN" name="K LAB Operaciones" />
      <div className="dash-shell">
        <AdminSidebar />
        <div className="dash-main">{children}</div>
      </div>
    </div>
  )
}

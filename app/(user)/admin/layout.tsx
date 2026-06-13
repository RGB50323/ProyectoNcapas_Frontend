import { AdminSidebar } from '@/components/dash'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div className="dash-main" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
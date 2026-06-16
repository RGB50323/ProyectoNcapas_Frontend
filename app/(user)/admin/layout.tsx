'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { AdminSidebar } from '@/components/dash'
import { PageLoader } from '@/components/PageLoader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session) router.replace('/login')
    else if (session.role !== 'ADMIN') router.replace('/')
  }, [loading, session, router])

  if (loading || !session || session.role !== 'ADMIN') return <PageLoader />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div className="dash-main" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

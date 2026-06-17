'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { SellerSidebar } from '@/components/dash'
import { PageLoader } from '@/components/PageLoader'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session) router.replace('/login')
    else if (session.role !== 'SELLER') router.replace('/')
  }, [loading, session, router])

  if (loading || !session || session.role !== 'SELLER') return <PageLoader />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SellerSidebar />
      <div className="dash-main" style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

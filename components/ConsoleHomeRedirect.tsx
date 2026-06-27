'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function ConsoleHomeRedirect() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const dest = session?.role === 'ADMIN' ? '/admin/dashboard' : session?.role === 'SELLER' ? '/seller/dashboard' : null

  useEffect(() => {
    if (!loading && dest) router.replace(dest)
  }, [loading, dest, router])

  if (!dest) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em',
        color: 'var(--text-mute)', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          display: 'inline-block', width: 16, height: 16,
          border: '1.5px solid var(--border-bright)', borderTopColor: 'var(--accent-2)',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
        ABRIENDO CONSOLA
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

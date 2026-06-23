'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { getRecommendedProducts } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import ProductCard from '@/components/ProductCard'
import { Icon } from '@/components/Icon'

type RecommendedProductsClientProps = {
  title?: string
  eyebrow?: string
  metaPersonalized?: string
  metaFallback?: string
  limit?: number
  href?: string
  showLink?: boolean
  excludeIds?: string[]
  contained?: boolean
}

export default function RecommendedProductsClient({
  title = 'PARA TI',
  eyebrow = '◇ RECOMENDADOS',
  metaPersonalized = 'SEGUN TU HISTORIAL',
  metaFallback = 'VERIFICADAS',
  limit = 4,
  href = '/catalog',
  showLink = true,
  excludeIds = [],
  contained = true,
}: RecommendedProductsClientProps) {
  const excludeKey = excludeIds.join('|')
  const { session, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return

    let cancelled = false
    setReady(false)

    getRecommendedProducts(session)
      .then((items) => {
        if (!cancelled) {
          const blocked = new Set(excludeKey ? excludeKey.split('|') : [])
          setProducts(items.filter((item) => !blocked.has(item.id)).slice(0, limit))
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [loading, session, limit, excludeKey])

  if (!ready || products.length === 0) return null

  const personalized = session?.role === 'BUYER'

  return (
    <section style={{ borderTop: '1px solid var(--border)' }}>
      <div className={contained ? 'container' : undefined} style={{ paddingTop: 64, paddingBottom: 72 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>
            <div className="display" style={{ fontSize: 'clamp(30px, 3.5vw, 48px)', lineHeight: 0.9 }}>{title}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
            <span className="mono mute">{personalized ? metaPersonalized : metaFallback}</span>
            {showLink && <Link href={href} className="btn btn-ghost">Ver todo <Icon.ArrowR /></Link>}
          </div>
        </div>
        <div className="grid-products">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  )
}

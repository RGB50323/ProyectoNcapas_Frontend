'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import { Icon } from './Icon'
import Badges from './Badges'
import { useWishlist } from '@/lib/wishlist'

export default function ProductCard({ p }: { p: Product }) {
  const router = useRouter()
  const { has, toggle } = useWishlist()
  const [hov, setHov] = useState(false)
  const img = hov && p.images[1] ? p.images[1] : p.images[0]
  const open = () => router.push(`/product/${p.id}`)
  const onWish = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggle(p.id).catch(() => {})
  }

  return (
    <div className="prod" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={open}>
      <div className="prod-img">
        <img src={img} alt={p.name} />
        <Badges product={p} />
        <button className="prod-wish" onClick={onWish} aria-label="Favorito"><Icon.Heart filled={has(p.id)} /></button>
        <div className="prod-quick">
          <button className="btn btn-dark" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); open() }}>Vista rápida</button>
        </div>
      </div>
      <div className="prod-meta">
        <div className="prod-brand">{p.brand}</div>
        <div className="prod-name">{p.name}</div>
        <div className="prod-foot">
          <div className="prod-price">${p.price.toFixed(0)}</div>
          <div className="prod-rating">
            <Icon.Star filled /> {p.rating} ({p.reviews})
          </div>
        </div>
      </div>
    </div>
  )
}

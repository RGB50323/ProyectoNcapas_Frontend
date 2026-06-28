import type { Product } from '@/lib/types'

const BADGE_STYLE: Record<string, { cls: string; text?: string }> = {
  VERIFICADO: { cls: 'verified', text: '✓ VERIFICADO' },
  LIMITADO: { cls: 'limited' },
  'DROP PRIVADO': { cls: 'private' },
  SEMINUEVO: { cls: 'preowned' },
  'POCO STOCK': { cls: 'lowstock' },
  NUEVO: { cls: 'new' },
  DESTACADO: { cls: 'limited' },
}

export default function Badges({ product }: { product: Product }) {
  if (!product.badges || !product.badges.length) return null
  return (
    <div className="prod-badges">
      {product.badges.map((b) => {
        const key = b.toUpperCase()
        const style = BADGE_STYLE[key] ?? { cls: 'fallback' }
        return <span key={b} className={`badge ${style.cls}`}>{style.text ?? key}</span>
      })}
    </div>
  )
}
import type { Product } from '@/lib/types'

const BADGE_STYLE: Record<string, { cls: string; text?: string }> = {
  VERIFICADO: { cls: 'verified', text: '✓ VERIFICADO' },
  LIMITADO: { cls: 'limited' },
  'DROP PRIVADO': { cls: 'private' },
  SEMINUEVO: { cls: 'preowned' },
  'POCO STOCK': { cls: 'lowstock' },
  NUEVO: { cls: 'new' },
}

export default function Badges({ product }: { product: Product }) {
  if (!product.badges || !product.badges.length) return null
  return (
    <div className="prod-badges">
      {product.badges.map((b) => {
        const style = BADGE_STYLE[b] ?? { cls: '' }
        return <span key={b} className={`badge ${style.cls}`}>{style.text ?? b}</span>
      })}
    </div>
  )
}

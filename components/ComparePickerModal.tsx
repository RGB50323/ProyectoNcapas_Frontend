'use client'

import { useMemo, useState } from 'react'
import type { Product } from '@/lib/types'
import Modal from '@/components/Modal'
import { Icon } from '@/components/Icon'

export default function ComparePickerModal({
  open,
  onClose,
  onPick,
  products,
  excludeIds,
}: {
  open: boolean
  onClose: () => void
  onPick: (productId: string) => void
  products: Product[]
  excludeIds: string[]
}) {
  const [q, setQ] = useState('')

  const items = useMemo(() => {
    const term = q.trim().toLowerCase()
    let arr = products.filter((p) => !excludeIds.includes(p.id))
    if (term) arr = arr.filter((p) => `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(term))
    return arr.slice(0, 24)
  }, [products, excludeIds, q])

  const handlePick = (id: string) => {
    onPick(id)
    setQ('')
    onClose()
  }

  return (
    <Modal open={open} title="Elegir pieza para comparar" onClose={onClose} width={760}>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mute)', display: 'flex' }}>
          <Icon.Search />
        </span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, marca o SKU…"
          style={{
            width: '100%', padding: '12px 14px 12px 38px', background: 'var(--card)',
            border: '1px solid var(--border-bright)', color: 'var(--text)',
            fontFamily: 'var(--font-mono)', fontSize: 13, borderRadius: 0,
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="mono mute" style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, letterSpacing: '0.1em' }}>
          SIN RESULTADOS
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxHeight: 440, overflowY: 'auto' }}>
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', textAlign: 'left', cursor: 'pointer',
                background: 'var(--card)', border: '1px solid var(--border)', padding: 0, borderRadius: 0,
              }}
            >
              <div style={{ aspectRatio: '1/1', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: 10 }}>
                <div className="mono mute" style={{ fontSize: 10, letterSpacing: '0.08em' }}>{p.brand}</div>
                <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.3 }}>{p.name}</div>
                <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>${p.price}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
import type { ReactNode } from 'react'
import type { OrderStatus } from '@/lib/types'
import { Icon } from './Icon'

export function Qty({ value, onChange }: { value: number; onChange: (q: number) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 2 }}>
      <button onClick={() => onChange(Math.max(1, value - 1))} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }} aria-label="Menos"><Icon.Minus /></button>
      <div style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, minWidth: 40, textAlign: 'center' }}>{value}</div>
      <button onClick={() => onChange(value + 1)} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }} aria-label="Más"><Icon.Plus /></button>
    </div>
  )
}

export function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
      <span className="mute">{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
    </div>
  )
}

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  NEW: { label: 'Nuevo', cls: 'blue' },
  PAID: { label: 'Pagado', cls: 'blue' },
  PREPARING: { label: 'Preparando', cls: 'yellow' },
  SHIPPED: { label: 'Enviado', cls: 'blue' },
  DELIVERED: { label: 'Entregado', cls: 'green' },
  RETURN_REQUESTED: { label: 'Devolución', cls: 'yellow' },
  REFUNDED: { label: 'Reembolsado', cls: 'gray' },
  CANCELLED: { label: 'Cancelado', cls: 'red' },
}

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status] ?? { label: status, cls: 'gray' }
  return <span className={`pill ${m.cls}`}><Icon.Dot /> {m.label}</span>
}

export function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <input className="input" defaultValue={value} placeholder={placeholder} />
    </div>
  )
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

export function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
      {eyebrow && <div className="eyebrow" style={{ color: 'var(--accent-2)', marginBottom: 8 }}>{eyebrow}</div>}
      <div className="display" style={{ fontSize: 24, marginBottom: 24 }}>{title}</div>
      {children}
    </div>
  )
}

export function ReviewRow({ label, value, onEdit }: {
    label: string
    value: string
    onEdit?: () => void
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div className="mono mute">{label}</div>
            <div style={{ fontSize: 13 }}>{value}</div>
            {onEdit && (
                <button
                    className="mono"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-2)', cursor: 'pointer' }}
                    onClick={onEdit}
                >
                    EDITAR
                </button>
            )}
        </div>
    )
}

export function KPI({ label, value, delta, neg }: { label: string; value: string; delta?: string; neg?: boolean }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta && <div className={'delta' + (neg ? ' neg' : '')}>{neg ? '↓' : '↑'} {delta}</div>}
    </div>
  )
}

'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
export const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
export const STATUS_FILL: Record<string, string> = {
  PENDING: 'var(--warn)', CONFIRMED: 'var(--info)', SHIPPED: 'var(--accent-2)',
  DELIVERED: 'var(--ok)', CANCELLED: 'var(--danger)', REFUNDED: 'var(--text-mute)',
}
export const STATUS_PILL: Record<string, string> = {
  PENDING: 'yellow', CONFIRMED: 'blue', SHIPPED: 'blue', DELIVERED: 'green', CANCELLED: 'red', REFUNDED: 'gray',
}
export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const shortDate = (s: string) => String(s).replace('T', ' ').slice(0, 16)

export const tooltipProps = {
  contentStyle: { background: 'var(--elev)', border: '1px solid var(--border-bright)', borderRadius: 0, fontFamily: 'var(--font-mono)', fontSize: 12 },
  labelStyle: { color: 'var(--text)' },
  itemStyle: { color: 'var(--text-dim)' },
  cursor: { fill: 'oklch(0.212 0.016 62 / 0.4)' },
}
export const axisTick = { fill: 'var(--text-mute)', fontSize: 11, fontFamily: 'var(--font-mono)' }

export function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href: string }) {
  return (
    <Link href={href} className="card" style={{ padding: 24, textDecoration: 'none', display: 'block' }}>
      <div className="label" style={{ marginBottom: 12 }}>{label}</div>
      <div className="display" style={{ fontSize: 'clamp(24px, 6vw, 34px)', lineHeight: 1 }}>{value}</div>
      {sub && <div className="mono" style={{ marginTop: 10, fontSize: 11, color: 'var(--accent-2)' }}>{sub}</div>}
    </Link>
  )
}

export function ChartCard({ title, action, empty, children }: { title: string; action?: ReactNode; empty?: boolean; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="display" style={{ fontSize: 15 }}>{title}</div>
        {action}
      </div>
      <div style={{ padding: 16, flex: 1, minHeight: 260, width: '100%', minWidth: 0 }}>
        {empty ? <div className="mono mute" style={{ padding: '70px 0', textAlign: 'center', fontSize: 13 }}>Sin datos aún.</div> : children}
      </div>
    </div>
  )
}

export function Legend({ data }: { data: { name: string; value: number; fill: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 12, justifyContent: 'center' }}>
      {data.map((d) => (
        <span key={d.name} className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, background: d.fill, display: 'inline-block' }} /> {d.name} · {d.value}
        </span>
      ))}
    </div>
  )
}

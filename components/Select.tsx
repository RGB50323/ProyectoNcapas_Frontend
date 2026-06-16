'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export type SelectOption = { value: string; label: string }

export function Select({ value, options, onChange, width, ariaLabel, placeholder }: {
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  width?: number | string
  ariaLabel?: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="sel" ref={ref} style={{ width }}>
      <button type="button" className={'sel-trigger' + (open ? ' open' : '')} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        <span className="sel-value" style={current ? undefined : { color: 'var(--text-mute)' }}>{current ? current.label : (placeholder ?? '')}</span>
        <span className="sel-chev"><Icon.ChevronD /></span>
      </button>
      {open && (
        <ul className="sel-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button type="button" className={'sel-opt' + (o.value === value ? ' on' : '')} onClick={() => { onChange(o.value); setOpen(false) }}>
                <span>{o.label}</span>
                {o.value === value && <Icon.Check />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

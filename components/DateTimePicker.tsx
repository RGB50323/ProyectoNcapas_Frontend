'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const pad = (n: number) => String(n).padStart(2, '0')

type Draft = { date: string; h: number; mi: number }

function parse(value: string): Draft {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value || '')
  if (!m) return { date: '', h: 12, mi: 0 }
  return { date: m[1], h: Number(m[2]), mi: Number(m[3]) }
}

function fmtTrigger(d: Draft): string | null {
  if (!d.date) return null
  const [y, mo, day] = d.date.split('-').map(Number)
  return `${pad(day)} ${MONTHS[mo - 1]} ${y} · ${pad(d.h)}:${pad(d.mi)}`
}

function monthMatrix(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const ITEM = 40
const PAD = 2

function ReelCore({ values, value, onChange, onPick, format = pad, width, editable, minValue, ariaLabel }: {
  values: number[]
  value: number
  onChange: (v: number) => void
  onPick?: (v: number) => void
  format?: (v: number) => string
  width?: number
  editable?: boolean
  minValue?: number
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [text, setText] = useState<string | null>(null)
  const floor = minValue ?? values[0]
  const max = values[values.length - 1]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const idx = values.indexOf(value)
    if (idx < 0) return
    const target = idx * ITEM
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  }, [value, values])

  const handleScroll = () => {
    const el = ref.current
    if (!el) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM)
      let v = values[Math.max(0, Math.min(values.length - 1, idx))]
      if (v < floor) { v = floor; el.scrollTo({ top: values.indexOf(v) * ITEM, behavior: 'smooth' }) }
      if (v !== value) onChange(v)
    }, 80)
  }

  const select = (v: number) => {
    if (v < floor) return
    const el = ref.current
    if (el) el.scrollTo({ top: values.indexOf(v) * ITEM, behavior: 'smooth' })
    onChange(v)
    onPick?.(v)
  }

  const onType = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 2)
    setText(d)
    if (d === '') return
    const n = Math.max(floor, Math.min(max, Number(d)))
    if (n !== value) onChange(n)
  }

  return (
    <div className="dt-reel-wrap" style={width ? { width } : undefined}>
      <div className="dt-reel-band" />
      {editable && (
        <input
          className="dt-reel-input"
          inputMode="numeric"
          aria-label={ariaLabel}
          value={text ?? pad(value)}
          onFocus={(e) => { setText(pad(value)); e.currentTarget.select() }}
          onBlur={() => setText(null)}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
        />
      )}
      <div className="dt-reel" ref={ref} onScroll={handleScroll} role="listbox" aria-label={ariaLabel}>
        <div style={{ height: ITEM * PAD }} />
        {values.map((v) => (
          <button
            type="button"
            key={v}
            role="option"
            aria-selected={v === value}
            disabled={v < floor}
            className={'dt-reel-item' + (v === value ? ' on' : '') + (v < floor ? ' off' : '')}
            onClick={() => select(v)}
          >
            {format(v)}
          </button>
        ))}
        <div style={{ height: ITEM * PAD }} />
      </div>
    </div>
  )
}

function TimeReel({ values, value, onChange, minValue, ariaLabel }: {
  values: number[]
  value: number
  onChange: (v: number) => void
  minValue?: number
  ariaLabel: string
}) {
  const floor = minValue ?? values[0]
  const step = (dir: number) => {
    const i = values.indexOf(value)
    const ni = Math.max(values.indexOf(floor), Math.min(values.length - 1, (i < 0 ? 0 : i) + dir))
    onChange(values[ni])
  }

  return (
    <div className="dt-reel-col">
      <button type="button" className="dt-reel-arrow" onClick={() => step(-1)} aria-label={`${ariaLabel} arriba`}><ChevU /></button>
      <ReelCore values={values} value={value} onChange={onChange} editable minValue={minValue} ariaLabel={ariaLabel} />
      <button type="button" className="dt-reel-arrow" onClick={() => step(1)} aria-label={`${ariaLabel} abajo`}><ChevDn /></button>
      <span className="dt-reel-lbl">{ariaLabel}</span>
    </div>
  )
}

function ReelSelect({ values, value, onChange, format, width, ariaLabel }: {
  values: number[]
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  width: number
  ariaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className="dt-rs" ref={ref} style={{ width }}>
      <button type="button" className={'sel-trigger' + (open ? ' open' : '')} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen((o) => !o)}>
        <span className="sel-value">{format(value)}</span>
        <span className="sel-chev"><Icon.ChevronD /></span>
      </button>
      {open && (
        <div className="dt-rs-pop">
          <ReelCore values={values} value={value} onChange={onChange} onPick={() => setOpen(false)} format={format} width={width} ariaLabel={ariaLabel} />
        </div>
      )}
    </div>
  )
}

export default function DateTimePicker({ value, onChange, ariaLabel }: {
  value: string
  onChange: (v: string) => void
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const draft = parse(value)

  const today = new Date()
  const [view, setView] = useState(() => {
    if (draft.date) {
      const [y, m] = draft.date.split('-').map(Number)
      return { y, m: m - 1 }
    }
    return { y: today.getFullYear(), m: today.getMonth() }
  })

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

  const emit = (next: Draft) => {
    if (!next.date) return
    onChange(`${next.date}T${pad(next.h)}:${pad(next.mi)}`)
  }

  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const nowH = today.getHours()
  const nowMi = today.getMinutes()
  const isToday = draft.date === todayStr
  const minHour = isToday ? nowH : 0
  const minMinute = isToday && draft.h <= nowH ? nowMi : 0

  const clampToday = (next: Draft): Draft => {
    if (next.date !== todayStr) return next
    let { h, mi } = next
    if (h < nowH) { h = nowH; mi = nowMi }
    else if (h === nowH && mi < nowMi) { mi = nowMi }
    return { ...next, h, mi }
  }

  const pickDay = (day: number) => {
    const date = `${view.y}-${pad(view.m + 1)}-${pad(day)}`
    emit(clampToday({ ...draft, date }))
  }

  const stepMonth = (dir: number) => {
    setView((v) => {
      const d = new Date(v.y, v.m + dir, 1)
      if (d.getFullYear() < today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth())) return v
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const baseYear = today.getFullYear()
  const years: number[] = []
  for (let y = baseYear; y <= baseYear + 25; y++) years.push(y)
  if (!years.includes(view.y)) { years.push(view.y); years.sort((a, b) => a - b) }

  const label = fmtTrigger(draft)
  const cells = monthMatrix(view.y, view.m)

  return (
    <div className="dt" ref={ref}>
      <button
        type="button"
        className={'dt-trigger' + (open ? ' open' : '')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dt-cal-ico"><CalIcon /></span>
        <span className={'dt-value' + (label ? '' : ' empty')}>{label ?? 'SELECCIONAR FECHA Y HORA'}</span>
        <span className="dt-chev"><Icon.ChevronD /></span>
      </button>

      {open && (
        <div className="dt-pop" role="dialog" aria-label={ariaLabel}>
          <div className="dt-cal">
            <div className="dt-cal-head">
              <button type="button" className="dt-nav" onClick={() => stepMonth(-1)} aria-label="Mes anterior"><ChevL /></button>
              <div className="dt-selects">
                <ReelSelect
                  values={view.y === today.getFullYear()
                    ? Array.from({ length: 12 - today.getMonth() }, (_, i) => i + today.getMonth())
                    : Array.from({ length: 12 }, (_, i) => i)}
                  value={view.m}
                  onChange={(m) => setView((s) => ({ ...s, m }))}
                  format={(m) => MONTHS[m]}
                  width={84}
                  ariaLabel="Mes"
                />
                <ReelSelect
                  values={years}
                  value={view.y}
                  onChange={(y) => setView((s) => ({ ...s, y }))}
                  format={String}
                  width={84}
                  ariaLabel="Año"
                />
              </div>
              <button type="button" className="dt-nav" onClick={() => stepMonth(1)} aria-label="Mes siguiente"><ChevR /></button>
            </div>
            <div className="dt-grid dt-dow">
              {WEEKDAYS.map((d, i) => <span key={i} className="dt-dowcell">{d}</span>)}
            </div>
            <div className="dt-grid">
              {cells.map((day, i) => {
                if (day == null) return <span key={i} className="dt-day empty" />
                const ds = `${view.y}-${pad(view.m + 1)}-${pad(day)}`
                const selected = ds === draft.date
                const isTodayCell = ds === todayStr
                const past = ds < todayStr
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={past}
                    className={'dt-day' + (selected ? ' on' : '') + (isTodayCell ? ' today' : '') + (past ? ' off' : '')}
                    onClick={() => { if (!past) pickDay(day) }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="dt-time">
            <div className="dt-time-cols">
              <TimeReel values={Array.from({ length: 24 }, (_, i) => i)} value={draft.h} onChange={(h) => emit(clampToday({ ...draft, h }))} minValue={minHour} ariaLabel="HORA" />
              <span className="dt-colon">:</span>
              <TimeReel values={Array.from({ length: 60 }, (_, i) => i)} value={draft.mi} onChange={(mi) => emit(clampToday({ ...draft, mi }))} minValue={minMinute} ariaLabel="MIN" />
            </div>
            <button type="button" className="dt-done" onClick={() => setOpen(false)}>Listo</button>
          </div>
        </div>
      )}
    </div>
  )
}

const CalIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
const ChevL = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m14 6-6 6 6 6" /></svg>
const ChevR = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m10 6 6 6-6 6" /></svg>
const ChevU = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 15 6-6 6 6" /></svg>
const ChevDn = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>

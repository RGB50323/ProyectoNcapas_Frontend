'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Drop } from '@/lib/types'
import { Icon } from '@/components/Icon'
import { useAuth } from '@/lib/auth'
import { usePaged } from '@/hooks/usePaged'
import Pagination from '@/components/Pagination'

const ALERT_KEY = 'klab_drop_alerts'
const PAGE_SIZE = 5

function loadAlerts(): string[] {
  try {
    const raw = localStorage.getItem(ALERT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAlerts(ids: string[]) {
  try {
    localStorage.setItem(ALERT_KEY, JSON.stringify(ids))
  } catch {}
}

function toIcsDate(iso: string): string {
  const d = new Date(iso)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function downloadIcs(d: Drop) {
  const start = toIcsDate(d.rawDate)
  const endDate = new Date(new Date(d.rawDate).getTime() + 60 * 60 * 1000)
  const end = toIcsDate(endDate.toISOString())
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//K LAB//Drops//ES',
    'BEGIN:VEVENT',
    `UID:${d.id}@klab`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${d.title} — K LAB Drop`,
    `DESCRIPTION:Lanzamiento ${d.type} · ${d.units} unidades`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${d.title.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DropsClient({ drops }: { drops: Drop[] }) {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [tab, setTab] = useState<'PRÓXIMOS' | 'PASADOS' | 'SOLO PRIVADOS'>('PRÓXIMOS')
  const [alerts, setAlerts] = useState<string[]>(() => (typeof window !== 'undefined' ? loadAlerts() : []))

  const isLoggedIn = !loading && !!session

  const toggleAlert = (id: string) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setAlerts((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      saveAlerts(next)
      return next
    })
  }

  const handleCalendar = (d: Drop, isPrivate: boolean) => {
    if (isPrivate && !isLoggedIn) {
      router.push('/login')
      return
    }
    downloadIcs(d)
  }

  const filtered = useMemo(() => {
    const now = Date.now()
    let arr = [...drops]
    if (tab === 'PRÓXIMOS') arr = arr.filter((d) => new Date(d.rawDate).getTime() >= now)
    if (tab === 'PASADOS') arr = arr.filter((d) => new Date(d.rawDate).getTime() < now)
    if (tab === 'SOLO PRIVADOS') arr = arr.filter((d) => d.type === 'DROP PRIVADO')
    arr.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
    if (tab === 'PASADOS') arr.reverse()
    return arr
  }, [drops, tab])

  const { page, setPage, pageItems, pageCount } = usePaged(filtered, PAGE_SIZE, tab)

  return (
    <div className="container page">
      <div className="crumbs"><Link href="/">Inicio</Link><span className="sep">/</span><em>Drops</em></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 48, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ CALENDARIO DEL LAB · EN VIVO</div>
          <h1 className="display" style={{ fontSize: 80, marginTop: 12, lineHeight: 0.9 }}>CALENDARIO<br />DE DROPS</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['PRÓXIMOS', 'PASADOS', 'SOLO PRIVADOS'] as const).map((t) => (
            <button key={t} className={'tag' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '14px 0' }}>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ SIN DROPS</div>
          <div className="display" style={{ fontSize: 36, marginTop: 12 }}>NADA EN ESTA VISTA TODAVÍA.</div>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 12 }}>
            {tab === 'PRÓXIMOS' ? 'No hay lanzamientos programados por ahora.' : tab === 'PASADOS' ? 'Aún no hay historial de drops.' : 'No hay drops privados activos.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)' }}>
            {pageItems.map((d, i) => {
              const [day, time] = d.date.split('·')
              const isPrivate = d.type === 'DROP PRIVADO'
              const dayLabel = (day ?? '').trim()
              const timeLabel = (time ?? '').trim()
              const isAlerted = alerts.includes(d.id)
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '200px 280px 1fr auto', gap: 32, padding: 32, borderBottom: i < pageItems.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <div>
                    <div className="mono accent" style={{ letterSpacing: '0.14em' }}>{dayLabel}</div>
                    <div className="display" style={{ fontSize: 32, marginTop: 4, color: 'var(--accent-2)' }}>{timeLabel}</div>
                    <div className="mono mute" style={{ marginTop: 4 }}>GMT</div>
                  </div>
                  <div style={{ aspectRatio: '4/3', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <img src={d.img} alt={d.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <span className={'badge ' + (isPrivate ? 'private' : '')}>{d.type}</span>
                      <span className="badge">{d.units} UNIDADES</span>
                    </div>
                    <h3 className="display" style={{ fontSize: 36, lineHeight: 1 }}>{d.title}</h3>
                    <p className="mute" style={{ marginTop: 12, fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>
                      {isPrivate
                        ? 'Lanzamiento miembros primero. Requiere nivel K-Select. Actívate para entrar en la fila.'
                        : 'Lanzamiento público. Primero en llegar, primero en asegurar. Pon un recordatorio para entrar al laboratorio a tiempo.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                    <button
                      className="btn"
                      style={isAlerted ? { background: 'var(--card)', color: 'var(--accent-2)', border: '1px solid var(--accent-2)' } : undefined}
                      onClick={() => toggleAlert(d.id)}
                      title={!isLoggedIn ? 'Inicia sesión para activar la alerta' : undefined}
                    >
                      {isAlerted ? '✓ Te avisaremos' : 'Avísame'} <Icon.ArrowR />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleCalendar(d, isPrivate)}
                      title={isPrivate && !isLoggedIn ? 'Inicia sesión para agendar drops privados' : undefined}
                    >
                      Agregar al calendario
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 32 }}>
            <Pagination page={page} pageCount={pageCount} onPage={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
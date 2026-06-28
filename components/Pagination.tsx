'use client'

function pages(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const from = Math.max(2, page - 1)
  const to = Math.min(pageCount - 1, page + 1)
  if (from > 2) out.push('…')
  for (let i = from; i <= to; i++) out.push(i)
  if (to < pageCount - 1) out.push('…')
  out.push(pageCount)
  return out
}

export default function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  if (pageCount <= 1) return null

  return (
    <div className="pager">
      <button className="pager-btn" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Anterior">‹</button>
      {pages(page, pageCount).map((p, i) =>
        p === '…'
          ? <span key={`dots-${i}`} className="pager-dots">…</span>
          : <button key={p} className={`pager-btn${p === page ? ' active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      )}
      <button className="pager-btn" disabled={page === pageCount} onClick={() => onPage(page + 1)} aria-label="Siguiente">›</button>
    </div>
  )
}

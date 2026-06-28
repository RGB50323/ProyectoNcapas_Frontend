'use client'

import { useEffect, useState } from 'react'

export function usePaged<T>(items: T[], pageSize: number, resetKey?: unknown) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => { setPage(1) }, [resetKey])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])

  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return { page, setPage, pageItems, pageCount, total: items.length }
}

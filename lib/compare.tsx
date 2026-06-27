'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const COMPARE_KEY = 'klab_compare'
export const MAX_COMPARE = 4

interface CompareContextValue {
  ids: string[]
  count: number
  max: number
  has: (productId: string) => boolean
  add: (productId: string) => void
  remove: (productId: string) => void
  setAt: (index: number, productId: string) => void
  clear: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

function readStored(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COMPARE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setIds(readStored())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids))
  }, [ids, hydrated])

  const has = useCallback((productId: string) => ids.includes(productId), [ids])

  const add = useCallback((productId: string) => {
    setIds((cur) => {
      if (cur.includes(productId)) return cur
      if (cur.length >= MAX_COMPARE) return [...cur.slice(1), productId]
      return [...cur, productId]
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setIds((cur) => cur.filter((id) => id !== productId))
  }, [])

  const setAt = useCallback((index: number, productId: string) => {
    setIds((cur) => {
      const next = [...cur]
      const existingIdx = next.indexOf(productId)
      if (existingIdx !== -1 && existingIdx !== index) next.splice(existingIdx, 1)
      while (next.length <= index) next.push('')
      next[index] = productId
      return next.filter((id) => id !== '')
    })
  }, [])

  const clear = useCallback(() => setIds([]), [])

  return (
    <CompareContext.Provider value={{ ids, count: ids.length, max: MAX_COMPARE, has, add, remove, setAt, clear }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare debe usarse dentro de <CompareProvider>')
  return ctx
}
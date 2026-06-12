'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const AUTH_API = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
const STORAGE_KEY = 'klab_session'

export type Role = 'ADMIN' | 'SELLER' | 'BUYER'

export interface Session {
  accessToken: string
  refreshToken: string
  expiresAt: string
  role: Role
  email: string
  firstName: string
  lastName: string,
  phone: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<Session>
  register: (data: RegisterData) => Promise<Session>
  logout: () => Promise<void>
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AUTH_API}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = json?.message
    if (typeof msg === 'string') throw new Error(msg)
    if (msg && typeof msg === 'object') throw new Error(Object.values(msg).join('. '))
    throw new Error(`Error ${res.status}`)
  }
  return json?.data as T
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSession(JSON.parse(raw))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  function persist(s: Session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSession(s)
  }

  async function login(email: string, password: string) {
    const s = await postAuth<Session>('login', { email, password })
    persist(s)
    return s
  }

  async function register(data: RegisterData) {
    const s = await postAuth<Session>('register', data)
    persist(s)
    return s
  }

  async function logout() {
    if (session) {
      await postAuth('logout', { refreshToken: session.refreshToken }).catch(() => {})
    }
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function getUserId(session: Session): string | null {
  try {
    const payload = JSON.parse(atob(session.accessToken.split(".")[1]));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export function authFetch(path: string, session: Session, init: RequestInit = {}) {
  return fetch(`${AUTH_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  })
}
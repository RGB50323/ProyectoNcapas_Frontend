'use client'

import { useEffect, useState, type ReactNode, type SubmitEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, type Session } from '@/lib/auth'

function destinationFor(session: Session) {
  if (session.role === 'ADMIN') return '/admin/dashboard'
  if (session.role === 'SELLER') return '/seller/dashboard'
  return '/'
}

function HintField({ hint, children }: { hint?: string; children: ReactNode }) {
  if (!hint) return <>{children}</>
  return (
    <div className="field-hint">
      {children}
      <button type="button" className="hint-btn" aria-label="Ayuda">?</button>
      <div className="hint-pop" role="tooltip">{hint}</div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { session, loading, login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!loading && session) router.replace(destinationFor(session))
  }, [loading, session, router])

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const s = await login(email, password)
        router.replace(destinationFor(s))
        return
      }
      await register({ firstName, lastName, email, password, confirmPassword, phone: phone || undefined })
      setMode('login')
      setPassword('')
      setConfirmPassword('')
      setNotice('Cuenta creada. Iniciá sesión con tu correo y contraseña.')
      setBusy(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal, intentá de nuevo')
      setBusy(false)
    }
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
    setNotice('')
  }

  if (loading || session) return null

  return (
    <div className="container page" style={{ display: 'flex', justifyContent: 'center', padding: '80px 32px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>◆ ACCESO AL LAB</div>
        <h1 className="display" style={{ fontSize: 48, marginBottom: 32 }}>
          {mode === 'login' ? 'INICIAR SESIÓN.' : 'CREAR CUENTA.'}
        </h1>

        <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--border)' }}>
          {([['login', 'Ya tengo cuenta'], ['register', 'Soy nuevo']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => switchMode(k)}
              className="mono"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '12px 18px', textTransform: 'uppercase',
                color: mode === k ? 'var(--text)' : 'var(--text-mute)',
                borderBottom: `1px solid ${mode === k ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <input className="input" placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <input className="input" placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          )}

          <input className="input" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <HintField hint={mode === 'register' ? 'Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un símbolo (@$!%*?&).' : undefined}>
            <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </HintField>

          {mode === 'register' && (
            <>
              <input className="input" type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              <input className="input" type="tel" placeholder="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
          )}

          {notice && (
            <div className="mono" style={{ color: 'var(--ok)', fontSize: 12, padding: '12px 14px', border: '1px solid var(--ok)', background: 'color-mix(in oklch, var(--ok) 12%, transparent)' }}>
              {notice}
            </div>
          )}

          {error && (
            <div className="mono" style={{ color: 'var(--danger)', fontSize: 12, padding: '12px 14px', border: '1px solid var(--danger)', background: 'color-mix(in oklch, var(--danger) 12%, transparent)' }}>
              {error}
            </div>
          )}

          <button className="btn btn-lg" type="submit" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? 'UN MOMENTO…' : mode === 'login' ? 'ENTRAR AL LAB →' : 'CREAR CUENTA →'}
          </button>
        </form>
      </div>
    </div>
  )
}

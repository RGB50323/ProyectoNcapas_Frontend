'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, authFetch, getUserId } from '@/lib/auth'
import { formatSvPhone, cleanPhone, isValidPhone, hasLocalNumber } from '@/lib/phone'
import { PageLoader } from '@/components/PageLoader'
import Modal from '@/components/Modal'
import { useToast } from '@/hooks/useToast'

type SellerProfile = {
  id: string
  storeName: string
  storeDescription: string
  totalSales: number
  verified: boolean
  createdAt: string | null
}

function formatStoreDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SellerProfilePage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const { show, ToastContainer } = useToast()

  const [editingInfo, setEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [storeLoading, setStoreLoading] = useState(true)
  const [editingStore, setEditingStore] = useState(false)
  const [savingStore, setSavingStore] = useState(false)
  const [storeForm, setStoreForm] = useState({ storeName: '', storeDescription: '' })
  const [storeError, setStoreError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      setForm({
        firstName: session.firstName,
        lastName: session.lastName ?? '',
        email: session.email,
        phone: (session as any).phone ?? '',
      })
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    const userId = getUserId(session)
    authFetch('/seller_profiles/', session)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const p = json?.data?.find((s: any) => s.user.uuid === userId) ?? null
        setProfile(p)
        if (p) setStoreForm({ storeName: p.storeName, storeDescription: p.storeDescription })
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStoreLoading(false) })
    return () => { cancelled = true }
  }, [session])

  if (loading || !session) return <PageLoader />

  const initials = `${session.firstName[0]}${session.lastName?.[0] ?? ''}`.toUpperCase()

  function startEditInfo() {
    setForm((prev) => ({ ...prev, phone: prev.phone ? formatSvPhone(prev.phone) : '+503 ' }))
    setEditingInfo(true)
  }

  function cancelEditInfo() {
    setForm({
      firstName: session!.firstName,
      lastName: session!.lastName ?? '',
      email: session!.email,
      phone: (session as any)?.phone ?? '',
    })
    setEditingInfo(false)
  }

  async function handleSaveInfo() {
    setSavingInfo(true)
    try {
      const userId = getUserId(session!)
      if (!userId) { show('No se pudo obtener tu ID de usuario.', 'error'); return }

      const phoneProvided = hasLocalNumber(form.phone)
      if (phoneProvided && !isValidPhone(form.phone)) {
        show('Teléfono inválido. Formato: +503 XXXX-XXXX', 'error'); return
      }

      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        ...(phoneProvided ? { phone: cleanPhone(form.phone) } : {}),
      }

      const res = await authFetch(`/users/update/${userId}`, session!, { method: 'PUT', body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.message
        const text = typeof msg === 'string' ? msg : msg && typeof msg === 'object' ? Object.values(msg).join('. ') : null
        show(text ?? `Error ${res.status}`, 'error'); return
      }

      const updated = json?.data
      if (updated?.accessToken) localStorage.setItem('klab_session', JSON.stringify({ ...session, ...updated }))
      show('Información actualizada', 'success')
      window.location.reload()
    } catch {
      show('No se pudo conectar con el servidor.', 'error')
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleSaveStore() {
    if (!profile || !session) return
    setStoreError(null)
    setSavingStore(true)
    try {
      const res = await authFetch(`/seller_profiles/update/${profile.id}`, session, {
        method: 'PUT',
        body: JSON.stringify({ storeName: storeForm.storeName.trim(), storeDescription: storeForm.storeDescription.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.message
        throw new Error(typeof msg === 'string' ? msg : msg ? Object.values(msg).join('. ') : `Error ${res.status}`)
      }
      setProfile(json?.data)
      setEditingStore(false)
    } catch (err: any) {
      setStoreError(err.message ?? 'Error al guardar los cambios.')
    } finally {
      setSavingStore(false)
    }
  }

  async function handleDelete() {
    if (!profile || !session) return
    setDeleteError(null)
    setDeleting(true)
    try {
      const res = await authFetch(`/seller_profiles/${profile.id}`, session, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.message
        throw new Error(typeof msg === 'string' ? msg : `Error ${res.status}`)
      }
      const updated = json?.data
      if (updated?.accessToken) localStorage.setItem('klab_session', JSON.stringify({ ...session, ...updated }))
      window.location.assign('/')
    } catch (err: any) {
      setDeleteError(err.message ?? 'Error al eliminar la tienda.')
      setDeleting(false)
    }
  }

  return (
    <div>
      <ToastContainer />

      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ CUENTA</div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>PERFIL DE TIENDA</h1>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'var(--accent-2)' }} />
        <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 72, height: 72, border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)', flexShrink: 0, background: 'var(--elev)' }}>
            {initials}
          </div>
          <div>
            <h2 className="display" style={{ fontSize: 'clamp(26px, 6.5vw, 36px)', lineHeight: 0.95, marginBottom: 10 }}>
              {`${session.firstName.toUpperCase()} ${session.lastName?.toUpperCase() ?? ''}`}
            </h2>
            <p className="mono mute" style={{ fontSize: 12 }}>
              {session.email}
              <span style={{ display: 'inline-block', marginLeft: 12, padding: '2px 8px', border: '1px solid var(--border)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-mute)' }}>
                {session.role}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 16, alignItems: 'stretch' }}>
        <div className="card" style={{ padding: 28, height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h2 className="display" style={{ fontSize: 18 }}>INFORMACIÓN PERSONAL</h2>
            {!editingInfo && (
              <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={startEditInfo}>Editar</button>
            )}
          </div>

          {editingInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                {([
                  { label: 'NOMBRE', name: 'firstName', type: 'text' },
                  { label: 'APELLIDO', name: 'lastName', type: 'text' },
                  { label: 'CORREO ELECTRÓNICO', name: 'email', type: 'email' },
                  { label: 'TELÉFONO', name: 'phone', type: 'tel' },
                ] as const).map((f) => (
                  <div key={f.name}>
                    <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                    <input
                      className="input"
                      type={f.type}
                      value={(form as any)[f.name]}
                      onChange={f.name === 'phone'
                        ? (e) => setForm((prev) => ({ ...prev, phone: formatSvPhone(e.target.value) }))
                        : (e) => setForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      placeholder={f.name === 'phone' ? '+503 XXXX-XXXX' : f.label}
                      disabled={savingInfo}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={cancelEditInfo} disabled={savingInfo}>Cancelar</button>
                <button className="btn" style={{ padding: '8px 20px', fontSize: 11 }} onClick={handleSaveInfo} disabled={savingInfo}>{savingInfo ? 'Guardando…' : 'Guardar cambios'}</button>
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: 'NOMBRE', value: session.firstName },
                { label: 'APELLIDO', value: session.lastName },
                { label: 'CORREO ELECTRÓNICO', value: session.email },
                { label: 'TELÉFONO', value: (session as any).phone || <span style={{ color: 'var(--text-mute)', fontStyle: 'italic' }}>No registrado</span> },
              ].map((f, i, arr) => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="mono mute" style={{ fontSize: 11, letterSpacing: '0.12em' }}>{f.label}</div>
                  <div style={{ fontSize: 16, color: 'var(--text)', textAlign: 'right' }}>{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <h2 className="display" style={{ fontSize: 18 }}>PERFIL DE LA TIENDA</h2>
              {profile && <span className={`pill ${profile.verified ? 'green' : 'gray'}`}>{profile.verified ? '● VERIFICADA' : 'SIN VERIFICAR'}</span>}
            </div>

            {storeLoading ? (
              <p className="mute" style={{ fontSize: 13 }}>Cargando tu tienda…</p>
            ) : !profile ? (
              <p className="mono mute" style={{ fontSize: 13 }}>No se encontró información de tu tienda.</p>
            ) : editingStore ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>NOMBRE DE TIENDA</div>
                  <input className="input" value={storeForm.storeName} onChange={(e) => setStoreForm((f) => ({ ...f, storeName: e.target.value }))} disabled={savingStore} />
                </div>
                <div>
                  <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>DESCRIPCIÓN</div>
                  <textarea className="input" value={storeForm.storeDescription} onChange={(e) => setStoreForm((f) => ({ ...f, storeDescription: e.target.value }))} disabled={savingStore} rows={4} style={{ resize: 'vertical' }} />
                </div>
                {storeError && <p className="mono" style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{storeError}</p>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => { setStoreForm({ storeName: profile.storeName, storeDescription: profile.storeDescription }); setStoreError(null); setEditingStore(false) }} disabled={savingStore}>Cancelar</button>
                  <button className="btn" style={{ padding: '8px 20px', fontSize: 11 }} onClick={handleSaveStore} disabled={savingStore}>{savingStore ? 'Guardando…' : 'Guardar'}</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                  {[
                    { label: 'TIENDA', value: profile.storeName },
                    { label: 'VENTAS TOTALES', value: profile.totalSales },
                    { label: 'REGISTRADA', value: formatStoreDate(profile.createdAt) },
                    { label: 'DESCRIPCIÓN', value: profile.storeDescription },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                      <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 14px', fontSize: 11 }} onClick={() => setEditingStore(true)}>Editar</button>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 14px', fontSize: 11, color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setDeleteOpen(true)}>Eliminar tienda</button>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <h2 className="display" style={{ fontSize: 18 }}>SEGURIDAD</h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', color: 'var(--ok)', border: '1px solid var(--ok)', padding: '2px 8px' }}>● ACTIVA</span>
            </div>
            <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>Actualiza tus credenciales periódicamente para mantener la cuenta protegida.</p>
            <button className="btn" style={{ width: '100%' }} onClick={() => router.push('/account/security')}>Actualizar contraseña</button>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} title="ELIMINAR TIENDA" onClose={() => { setDeleteOpen(false); setDeleteError(null) }} width={440}>
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Estás seguro que deseas eliminar tu tienda <strong style={{ color: 'var(--text)' }}>{profile?.storeName}</strong>? Esta acción cambiará tu rol a BUYER y no se puede deshacer.
        </p>
        {deleteError && <p className="mono" style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 16 }}>{deleteError}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => { setDeleteOpen(false); setDeleteError(null) }} disabled={deleting}>Cancelar</button>
          <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminando…' : 'Confirmar eliminación'}</button>
        </div>
      </Modal>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, authFetch, getUserId } from '@/lib/auth'
import { PageLoader } from '@/components/PageLoader'
import Modal from '@/components/Modal'

type SellerProfile = {
  id: string
  storeName: string
  storeDescription: string
  totalSales: number
  verified: boolean
}

export default function SellerProfilePage() {
  const router = useRouter()
  const { session } = useAuth()

  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ storeName: '', storeDescription: '' })
  const [editError, setEditError] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
        if (p) setForm({ storeName: p.storeName, storeDescription: p.storeDescription })
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [session])

  async function handleSave() {
    if (!profile || !session) return
    setEditError(null)
    setSaving(true)
    try {
      const res = await authFetch(`/seller_profiles/update/${profile.id}`, session, {
        method: 'PUT',
        body: JSON.stringify({ storeName: form.storeName.trim(), storeDescription: form.storeDescription.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = json?.message
        throw new Error(typeof msg === 'string' ? msg : msg ? Object.values(msg).join('. ') : `Error ${res.status}`)
      }
      setProfile(json?.data)
      setEditing(false)
    } catch (err: any) {
      setEditError(err.message ?? 'Error al guardar los cambios.')
    } finally {
      setSaving(false)
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
      if (updated?.accessToken) {
        localStorage.setItem('klab_session', JSON.stringify({ ...session, ...updated }))
      }
      window.location.assign('/')
    } catch (err: any) {
      setDeleteError(err.message ?? 'Error al eliminar la tienda.')
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◇ CUENTA</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PERFIL DE TIENDA</h1>
        </div>
        {profile && !editing && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Editar</button>
            <button className="btn btn-ghost" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setDeleteOpen(true)}>Eliminar tienda</button>
          </div>
        )}
      </div>

      {!profile ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="mono mute" style={{ fontSize: 13 }}>No se encontró información de tu tienda.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 28, maxWidth: 720 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h2 className="display" style={{ fontSize: 18 }}>{profile.storeName}</h2>
            <span className={`pill ${profile.verified ? 'green' : 'gray'}`}>
              {profile.verified ? '● VERIFICADA' : 'SIN VERIFICAR'}
            </span>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>NOMBRE DE TIENDA</div>
                <input className="input" value={form.storeName} onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))} disabled={saving} />
              </div>
              <div>
                <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>DESCRIPCIÓN</div>
                <textarea className="input" value={form.storeDescription} onChange={(e) => setForm((f) => ({ ...f, storeDescription: e.target.value }))} disabled={saving} rows={4} style={{ resize: 'vertical' }} />
              </div>
              {editError && <p className="mono" style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{editError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => { setForm({ storeName: profile.storeName, storeDescription: profile.storeDescription }); setEditError(null); setEditing(false) }} disabled={saving}>Cancelar</button>
                <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
              {[
                { label: 'TIENDA', value: profile.storeName },
                { label: 'VENTAS TOTALES', value: profile.totalSales },
                { label: 'VERIFICADO', value: profile.verified ? 'Sí' : 'No' },
                { label: 'DESCRIPCIÓN', value: profile.storeDescription },
              ].map((f) => (
                <div key={f.label}>
                  <div className="mono mute" style={{ fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

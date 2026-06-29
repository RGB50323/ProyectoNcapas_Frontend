'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth, type Session } from '@/lib/auth'
import Modal from '@/components/Modal'
import { Select } from '@/components/Select'
import DateTimePicker from '@/components/DateTimePicker'
import ImageDropzone from '@/components/ImageDropzone'
import { uploadProductImage } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { usePaged } from '@/hooks/usePaged'
import Pagination from '@/components/Pagination'
import { EditAction, DeleteAction } from '@/components/admin/RowActions'

export type FieldType = 'text' | 'number' | 'textarea' | 'checkbox' | 'datetime' | 'select' | 'image'

export interface Field {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
  step?: string
  placeholder?: string
  hidden?: (form: Record<string, any>) => boolean
}

export interface Column<T> {
  header: string
  cell: (item: T) => ReactNode
}

interface Props<T> {
  title: string
  eyebrow?: string
  noun: string
  getId: (item: T) => string
  columns: Column<T>[]
  fields: Field[]
  load: (s: Session) => Promise<T[]>
  create?: (s: Session, body: any) => Promise<unknown>
  createHref?: string
  update?: (s: Session, id: string, body: any) => Promise<unknown>
  editHref?: (item: T) => string
  remove?: (s: Session, id: string) => Promise<unknown>
  removeDisabledReason?: (item: T) => string | null
  toForm?: (item: T) => Record<string, any>
  toBody?: (form: Record<string, any>) => any
  rowLabel?: (item: T) => string
  filter?: (item: T) => boolean
  extraHeader?: ReactNode
  toolbar?: ReactNode
}

function defaultForm(fields: Field[]): Record<string, any> {
  const f: Record<string, any> = {}
  for (const fl of fields) f[fl.name] = fl.type === 'checkbox' ? false : ''
  return f
}

function defaultToForm(item: any, fields: Field[]): Record<string, any> {
  const f: Record<string, any> = {}
  for (const fl of fields) {
    const v = item[fl.name]
    if (fl.type === 'checkbox') f[fl.name] = !!v
    else if (fl.type === 'datetime') f[fl.name] = v ? String(v).slice(0, 16) : ''
    else f[fl.name] = v == null ? '' : String(v)
  }
  return f
}

function defaultToBody(form: Record<string, any>, fields: Field[]): any {
  const body: Record<string, any> = {}
  for (const fl of fields) {
    const v = form[fl.name]
    if (fl.type === 'checkbox') { body[fl.name] = !!v; continue }
    const empty = v === '' || v == null
    if (fl.type === 'number') {
      if (!empty) body[fl.name] = Number(v)
      else if (fl.required) body[fl.name] = 0
      continue
    }
    if (fl.type === 'datetime') {
      if (!empty) body[fl.name] = v.length === 16 ? `${v}:00` : v
      continue
    }
    if (!empty) body[fl.name] = v
  }
  return body
}

export default function CrudResource<T>({
  title, eyebrow, noun, getId, columns, fields,
  load, create, createHref, update, editHref, remove, removeDisabledReason, toForm, toBody, rowLabel, filter, extraHeader, toolbar,
}: Props<T>) {
  const { session } = useAuth()
  const { show, ToastContainer } = useToast()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<T | 'new' | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState('')

  async function handleUpload(name: string, file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Solo se permiten imágenes.'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('La imagen supera 5 MB.'); return }
    if (!session?.accessToken) { setUploadError('Inicia sesión para subir imágenes.'); return }
    setUploadError('')
    setUploadingField(name)
    try {
      const url = await uploadProductImage(file, session.accessToken)
      setForm((f) => ({ ...f, [name]: url }))
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'No se pudo subir la imagen.')
    } finally {
      setUploadingField(null)
    }
  }

  const refresh = useMemo(() => async () => {
    if (!session) return
    setLoading(true)
    try { setItems(await load(session)) } catch { setItems([]) } finally { setLoading(false) }
  }, [session, load])

  useEffect(() => { refresh() }, [refresh])

  const openNew = () => { setForm(defaultForm(fields)); setFormError(null); setEditing('new') }
  const openEdit = (item: T) => {
    setForm(toForm ? toForm(item) : defaultToForm(item, fields))
    setFormError(null)
    setEditing(item)
  }

  async function submit() {
    if (!session) return
    for (const fl of fields) {
      if (fl.required && fl.type !== 'checkbox' && !fl.hidden?.(form)) {
        const v = form[fl.name]
        if (v === '' || v == null) { setFormError(`${fl.label} es requerido.`); return }
      }
    }
    setSaving(true)
    setFormError(null)
    try {
      const body = toBody ? toBody(form) : defaultToBody(form, fields)
      if (editing === 'new') await create!(session, body)
      else await update!(session, getId(editing as T), body)
      show(`${noun} guardada correctamente`, 'success')
      setEditing(null)
      await refresh()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!session || !toDelete) return
    const blocked = removeDisabledReason?.(toDelete)
    if (blocked) {
      show(blocked, 'error')
      setToDelete(null)
      return
    }
    setDeleting(true)
    try {
      await remove!(session, getId(toDelete))
      show(`${noun} eliminada`, 'success')
      setToDelete(null)
      await refresh()
    } catch (e) {
      show(e instanceof Error ? e.message : 'No se pudo eliminar.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const shown = filter ? items.filter(filter) : items
  const { page, setPage, pageItems, pageCount } = usePaged(shown, 10, shown.length)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>{eyebrow}</div>}
          <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>{title}</h1>
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>{shown.length} REGISTRO{shown.length === 1 ? '' : 'S'}</div>
          {extraHeader}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {toolbar}
          {createHref ? (
            <Link className="btn" href={createHref}>+ Nuevo</Link>
          ) : create ? (
            <button className="btn" onClick={openNew}>+ Nuevo</button>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.header}>{c.header}</th>)}
              {(update || remove) && <th style={{ textAlign: 'right' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item) => (
              <tr key={getId(item)}>
                {columns.map((c) => <td key={c.header}>{c.cell(item)}</td>)}
                {(update || remove) && (
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {update && (
                      editHref ? <EditAction href={editHref(item)} /> : <EditAction onClick={() => openEdit(item)} />
                    )}
                    {remove && (() => {
                      const blocked = removeDisabledReason?.(item)
                      return (
                        <DeleteAction
                          disabled={!!blocked}
                          title={blocked ?? undefined}
                          onClick={() => {
                            if (blocked) { show(blocked, 'error'); return }
                            setToDelete(item)
                          }}
                        />
                      )
                    })()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && shown.length === 0 && (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>Sin registros.</div>
        )}
        {loading && (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>Cargando…</div>
        )}
        <Pagination page={page} pageCount={pageCount} onPage={setPage} />
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? `Nuevo ${noun}` : `Editar ${noun}`} onClose={() => setEditing(null)} width={520}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {fields.filter((fl) => !fl.hidden?.(form)).map((fl) => (
            <div key={fl.name}>
              {fl.type !== 'checkbox' && <div className="label">{fl.label}{fl.required ? ' *' : ''}</div>}
              {fl.type === 'textarea' ? (
                <textarea className="input" value={form[fl.name] ?? ''} placeholder={fl.placeholder} onChange={(e) => setForm((f) => ({ ...f, [fl.name]: e.target.value }))} style={{ minHeight: 80, resize: 'vertical' }} />
              ) : fl.type === 'select' ? (
                <Select
                  value={form[fl.name] ?? ''}
                  options={fl.options ?? []}
                  onChange={(v) => setForm((f) => ({ ...f, [fl.name]: v }))}
                  width="100%"
                  placeholder="— Seleccionar —"
                  ariaLabel={fl.label}
                />
              ) : fl.type === 'checkbox' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text-dim)' }}>
                  <input type="checkbox" checked={!!form[fl.name]} onChange={(e) => setForm((f) => ({ ...f, [fl.name]: e.target.checked }))} />
                  {fl.label}
                </label>
              ) : fl.type === 'datetime' ? (
                <DateTimePicker value={form[fl.name] ?? ''} onChange={(v) => setForm((f) => ({ ...f, [fl.name]: v }))} ariaLabel={fl.label} />
              ) : fl.type === 'image' ? (
                <div style={{ maxWidth: 220, margin: '0 auto' }}>
                  <ImageDropzone value={form[fl.name] ?? ''} uploading={uploadingField === fl.name} alt={fl.label} maxMb={5} onFile={(file) => handleUpload(fl.name, file)} />
                  {uploadError && <div className="mono" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{uploadError}</div>}
                </div>
              ) : (
                <input className="input" type={fl.type === 'number' ? 'number' : 'text'} step={fl.step} value={form[fl.name] ?? ''} placeholder={fl.placeholder} onChange={(e) => setForm((f) => ({ ...f, [fl.name]: fl.type === 'number' ? e.target.value.replace(/^0+(?=\d)/, '') : e.target.value }))} />
              )}
            </div>
          ))}
          {formError && <div className="mono" style={{ color: 'var(--danger)', fontSize: 12 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
            <button className="btn" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={toDelete !== null} title={`Eliminar ${noun}`} onClose={() => setToDelete(null)} width={420}>
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          ¿Eliminar <strong style={{ color: 'var(--text)' }}>{toDelete && (rowLabel ? rowLabel(toDelete) : getId(toDelete))}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setToDelete(null)} disabled={deleting}>Cancelar</button>
          <button className="btn" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={confirmDelete} disabled={deleting}>{deleting ? 'Eliminando…' : 'Eliminar'}</button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  )
}

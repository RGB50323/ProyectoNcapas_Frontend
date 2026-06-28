'use client'

import Link from 'next/link'
import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminDrop } from '@/lib/admin'
import { formatNaiveMono } from '@/lib/datetime'

export default function AdminDropsPage() {
  return (
    <CrudResource<AdminDrop>
      eyebrow="◆ VENTAS"
      title="DROPS"
      noun="drop"
      getId={(d) => d.id}
      rowLabel={(d) => d.title}
      load={admin.listDrops}
      create={admin.createDrop}
      update={admin.updateDrop}
      remove={admin.deleteDrop}
      columns={[
        { header: 'Título', cell: (d) => d.title },
        { header: 'Fecha', cell: (d) => <span className="mono mute">{formatNaiveMono(d.dropDate)}</span> },
        { header: 'Unidades', cell: (d) => <span className="mono">{d.units}</span> },
        { header: 'Tipo', cell: (d) => <span className="mono">{d.type === 'PRIVATE' ? 'PRIVADO' : 'PÚBLICO'}</span> },
        { header: 'Activo', cell: (d) => (d.active ? <span className="pill green">SÍ</span> : <span className="pill gray">NO</span>) },
        { header: 'Productos', cell: (d) => <Link className="mono accent" style={{ fontSize: 11 }} href={`/admin/drops/${d.id}/products`}>GESTIONAR →</Link> },
      ]}
      fields={[
        { name: 'title', label: 'Título', required: true },
        { name: 'slug', label: 'Slug', required: true, placeholder: 'boveda-alta-fase-2' },
        { name: 'dropDate', label: 'Fecha y hora', type: 'datetime', required: true },
        { name: 'type', label: 'Tipo', type: 'select', required: true, options: [{ value: 'PUBLIC', label: 'Público' }, { value: 'PRIVATE', label: 'Privado' }] },
        { name: 'coverImageUrl', label: 'Portada (opcional)', type: 'image' },
        { name: 'active', label: 'Activo', type: 'checkbox' },
      ]}
    />
  )
}

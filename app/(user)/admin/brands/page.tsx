'use client'

import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminBrand } from '@/lib/admin'

export default function AdminBrandsPage() {
  return (
    <CrudResource<AdminBrand>
      eyebrow="◆ CATÁLOGO"
      title="MARCAS"
      noun="marca"
      getId={(b) => b.id}
      rowLabel={(b) => b.name}
      load={admin.listBrands}
      create={admin.createBrand}
      update={admin.updateBrand}
      remove={admin.deleteBrand}
      columns={[
        { header: 'Nombre', cell: (b) => b.name },
        { header: 'Slug', cell: (b) => <span className="mono mute">{b.slug}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'slug', label: 'Slug', required: true, placeholder: 'nike' },
        { name: 'logoUrl', label: 'URL del logo (opcional)' },
      ]}
    />
  )
}

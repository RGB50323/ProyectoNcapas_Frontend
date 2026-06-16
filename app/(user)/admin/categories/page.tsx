'use client'

import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminCategory } from '@/lib/admin'

export default function AdminCategoriesPage() {
  return (
    <CrudResource<AdminCategory>
      eyebrow="◆ CATÁLOGO"
      title="CATEGORÍAS"
      noun="categoría"
      getId={(c) => c.id}
      rowLabel={(c) => c.name}
      load={admin.listCategories}
      create={admin.createCategory}
      update={admin.updateCategory}
      remove={admin.deleteCategory}
      columns={[
        { header: 'Nombre', cell: (c) => c.name },
        { header: 'Unidades', cell: (c) => <span className="mono">{c.units}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'units', label: 'Unidades', type: 'number', step: '1', required: true },
      ]}
    />
  )
}

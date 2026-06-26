'use client'

import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminBrand } from '@/lib/admin'
import { getProducts } from '@/lib/api'
import type { Session } from '@/lib/auth'

type BrandWithProducts = AdminBrand & {
  productCount: number
}

async function loadBrandsWithProducts(session: Session): Promise<BrandWithProducts[]> {
  const [brands, products] = await Promise.all([
    admin.listBrands(session),
    getProducts(session),
  ])

  return brands.map((brand) => ({
    ...brand,
    productCount: products.filter((product) => product.brandId === brand.id).length,
  }))
}

export default function AdminBrandsPage() {
  return (
    <CrudResource<BrandWithProducts>
      eyebrow="◆ CATÁLOGO"
      title="MARCAS"
      noun="marca"
      getId={(b) => b.id}
      rowLabel={(b) => b.name}
      load={loadBrandsWithProducts}
      create={admin.createBrand}
      update={admin.updateBrand}
      remove={admin.deleteBrand}
      removeDisabledReason={(b) =>
        b.productCount > 0 ? `No se puede eliminar esta marca porque tiene ${b.productCount} producto${b.productCount === 1 ? '' : 's'} asociado${b.productCount === 1 ? '' : 's'}.` : null
      }
      columns={[
        { header: 'Nombre', cell: (b) => b.name },
        { header: 'Slug', cell: (b) => <span className="mono mute">{b.slug}</span> },
        { header: 'Productos', cell: (b) => <span className="mono">{b.productCount}</span> },
      ]}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'slug', label: 'Slug', required: true, placeholder: 'nike' },
        { name: 'logoUrl', label: 'URL del logo (opcional)' },
      ]}
    />
  )
}

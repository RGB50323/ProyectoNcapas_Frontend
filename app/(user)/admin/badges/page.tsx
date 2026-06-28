'use client'

import { useEffect, useMemo, useState } from 'react'
import CrudResource from '@/components/admin/CrudResource'
import { admin, type AdminProductBadge, type AdminSeller } from '@/lib/admin'
import { getProducts } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Product } from '@/lib/types'

function productOption(product: Product) {
  return {
    value: product.id,
    label: `${product.name} · ${product.sku}`,
  }
}

export default function AdminBadgesPage() {
  const { session } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])

  useEffect(() => {
    if (!session) return
    getProducts(session).then(setProducts).catch(() => setProducts([]))
    admin.listSellers(session).then(setSellers).catch(() => setSellers([]))
  }, [session])

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )
  const sellersById = useMemo(
    () => new Map(sellers.map((seller) => [seller.id, seller])),
    [sellers]
  )

  return (
    <CrudResource<AdminProductBadge>
      eyebrow="◆ CATÁLOGO"
      title="ETIQUETAS"
      noun="etiqueta"
      getId={(badge) => badge.id}
      rowLabel={(badge) => badge.label}
      load={admin.listProductBadges}
      create={admin.createProductBadge}
      update={admin.updateProductBadge}
      remove={admin.deleteProductBadge}
      columns={[
        { header: 'Etiqueta', cell: (badge) => <span className="badge">{badge.label}</span> },
        {
          header: 'Producto',
          cell: (badge) => {
            const product = productsById.get(badge.productId)
            return (
              <div>
                <div>{product?.name ?? badge.productName}</div>
                <div className="mono mute" style={{ fontSize: 11 }}>
                  {product ? product.sku : badge.productId}
                </div>
              </div>
            )
          },
        },
        {
          header: 'Tienda',
          cell: (badge) => {
            const sellerId = productsById.get(badge.productId)?.sellerId
            return (
              <span className="mono mute">
                {sellerId ? sellersById.get(sellerId)?.storeName ?? sellerId : '-'}
              </span>
            )
          },
        },
        { header: 'Tipo', cell: () => <span className="mono mute">PERSISTIDA</span> },
      ]}
      fields={[
        {
          name: 'productId',
          label: 'Producto',
          type: 'select',
          required: true,
          options: products.map(productOption),
        },
        { name: 'label', label: 'Etiqueta', required: true, placeholder: 'Ej. Poco stock, Edición especial' },
      ]}
      toForm={(badge) => ({ productId: badge.productId, label: badge.label })}
      toBody={(form) => ({
        productId: String(form.productId),
        label: String(form.label).trim(),
      })}
    />
  )
}

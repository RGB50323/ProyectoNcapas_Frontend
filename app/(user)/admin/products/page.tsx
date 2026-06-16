'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import CrudResource from '@/components/admin/CrudResource'
import { Select } from '@/components/Select'
import { admin, type AdminSeller, type AdminCategory, type AdminBrand } from '@/lib/admin'
import { getProducts, deleteProduct } from '@/lib/api'
import type { Product } from '@/lib/types'

const CONDITIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'LIKE_NEW', label: 'Como nuevo' },
  { value: 'USED', label: 'Usado' },
  { value: 'REFURBISHED', label: 'Reacondicionado' },
]

export default function AdminProductsPage() {
  const { session } = useAuth()
  const params = useSearchParams()
  const categoryFilter = params.get('category') ?? ''

  const [sellerFilter, setSellerFilter] = useState(params.get('seller') ?? '')
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])

  useEffect(() => {
    if (!session) return
    admin.listSellers(session).then(setSellers).catch(() => {})
    admin.listCategories(session).then(setCategories).catch(() => {})
    admin.listBrands(session).then(setBrands).catch(() => {})
  }, [session])

  const storeName = (sellerId?: string) => sellers.find((s) => s.id === sellerId)?.storeName ?? '—'

  return (
    <CrudResource<Product>
      eyebrow="◆ CATÁLOGO"
      title="PRODUCTOS"
      noun="producto"
      getId={(p) => p.id}
      rowLabel={(p) => p.name}
      load={getProducts}
      create={admin.createProduct}
      update={admin.updateProduct}
      remove={(s, id) => deleteProduct(id, s.accessToken)}
      filter={(p) =>
        (!sellerFilter || p.sellerId === sellerFilter) &&
        (!categoryFilter || p.category === categoryFilter)
      }
      toolbar={
        <Select
          value={sellerFilter}
          onChange={setSellerFilter}
          width={220}
          ariaLabel="Filtrar por tienda"
          options={[{ value: '', label: 'Todas las tiendas' }, ...sellers.map((s) => ({ value: s.id, label: s.storeName }))]}
        />
      }
      columns={[
        {
          header: 'Producto',
          cell: (p) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={p.images[0]} alt={p.name} style={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</div>
                <div className="mono mute">{p.brand}</div>
              </div>
            </div>
          ),
        },
        { header: 'Tienda', cell: (p) => <span className="mono mute">{storeName(p.sellerId)}</span> },
        { header: 'SKU', cell: (p) => <span className="mono mute">{p.sku}</span> },
        { header: 'Precio', cell: (p) => <span className="mono">${p.price}</span> },
        { header: 'Stock', cell: (p) => <span className="mono">{p.totalStock}</span> },
      ]}
      toForm={(p) => ({
        sellerId: p.sellerId ?? '',
        categoryId: p.categoryId ?? p.category ?? '',
        brandId: p.brandId ?? '',
        sku: p.sku,
        name: p.name,
        slug: p.slug ?? '',
        description: p.desc ?? '',
        price: String(p.price),
        condition: p.condition,
        totalStock: String(p.totalStock),
        featured: p.featured,
        newProduct: p.isNew,
        limited: p.limited,
        privateDrop: p.privateDrop,
      })}
      toBody={(f) => ({
        sellerId: f.sellerId,
        categoryId: f.categoryId,
        brandId: f.brandId,
        sku: f.sku,
        name: f.name,
        slug: f.slug,
        description: f.description || undefined,
        price: Number(f.price),
        condition: f.condition,
        totalStock: Number(f.totalStock || 0),
        featured: !!f.featured,
        newProduct: !!f.newProduct,
        limited: !!f.limited,
        privateDrop: !!f.privateDrop,
      })}
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        { name: 'sku', label: 'SKU', required: true },
        { name: 'slug', label: 'Slug', required: true },
        { name: 'sellerId', label: 'Tienda', type: 'select', required: true, options: sellers.map((s) => ({ value: s.id, label: s.storeName })) },
        { name: 'categoryId', label: 'Categoría', type: 'select', required: true, options: categories.map((c) => ({ value: c.id, label: c.name })) },
        { name: 'brandId', label: 'Marca', type: 'select', required: true, options: brands.map((b) => ({ value: b.id, label: b.name })) },
        { name: 'price', label: 'Precio', type: 'number', step: '0.01', required: true },
        { name: 'condition', label: 'Condición', type: 'select', required: true, options: CONDITIONS },
        { name: 'totalStock', label: 'Stock total', type: 'number', step: '1', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'featured', label: 'Destacado', type: 'checkbox' },
        { name: 'newProduct', label: 'Nuevo', type: 'checkbox' },
        { name: 'limited', label: 'Limitado', type: 'checkbox' },
        { name: 'privateDrop', label: 'Drop privado', type: 'checkbox' },
      ]}
    />
  )
}

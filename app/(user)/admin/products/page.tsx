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

const AUTH_OPTIONS = [
  { value: '', label: 'Toda autenticación' },
  { value: 'NOT_SUBMITTED', label: 'Sin enviar' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'AUTHENTICATED', label: 'Autenticado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

const STOCK_OPTIONS = [
  { value: '', label: 'Todo stock' },
  { value: 'available', label: 'Disponible' },
  { value: 'low', label: 'Bajo stock' },
  { value: 'sold-out', label: 'Agotado' },
]

const AUTH_LABELS: Record<string, string> = {
  NOT_SUBMITTED: 'SIN ENVIAR',
  PENDING: 'PENDIENTE',
  AUTHENTICATED: 'AUTENTICADO',
  REJECTED: 'RECHAZADO',
}

function authPill(auth: string) {
  if (auth === 'AUTHENTICATED') return 'pill green'
  if (auth === 'PENDING') return 'pill yellow'
  if (auth === 'REJECTED') return 'pill red'
  return 'pill'
}

function stockMatches(product: Product, filter: string) {
  if (filter === 'available') return product.totalStock > 0
  if (filter === 'low') return product.lowStock > 0
  if (filter === 'sold-out') return product.soldOut
  return true
}

export default function AdminProductsPage() {
  const { session } = useAuth()
  const params = useSearchParams()

  const [query, setQuery] = useState('')
  const [sellerFilter, setSellerFilter] = useState(params.get('seller') ?? '')
  const [categoryFilter, setCategoryFilter] = useState(params.get('category') ?? '')
  const [authFilter, setAuthFilter] = useState(params.get('auth') ?? '')
  const [stockFilter, setStockFilter] = useState('')
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])

  useEffect(() => {
    if (!session) return
    admin.listSellers(session).then(setSellers).catch(() => {})
    admin.listCategories(session).then(setCategories).catch(() => {})
    admin.listBrands(session).then(setBrands).catch(() => {})
  }, [session])

  const storeName = (sellerId?: string) => sellers.find((s) => s.id === sellerId)?.storeName ?? '-'
  const categoryName = (categoryId?: string) => categories.find((c) => c.id === categoryId)?.name ?? '-'

  return (
    <CrudResource<Product>
      eyebrow="◆ CATÁLOGO"
      title="PRODUCTOS"
      noun="producto"
      getId={(p) => p.id}
      rowLabel={(p) => p.name}
      load={getProducts}
      create={admin.createProduct}
      createHref="/admin/products/new"
      update={admin.updateProduct}
      editHref={(p) => `/admin/products/${p.id}/edit`}
      remove={(s, id) => deleteProduct(id, s.accessToken)}
      filter={(p) => {
        const q = query.trim().toLowerCase()
        const seller = storeName(p.sellerId)
        const category = categoryName(p.categoryId ?? p.category)
        const haystack = `${p.name} ${p.sku} ${p.brand} ${seller} ${category}`.toLowerCase()

        return (
          (!q || haystack.includes(q)) &&
          (!sellerFilter || p.sellerId === sellerFilter) &&
          (!categoryFilter || p.category === categoryFilter || p.categoryId === categoryFilter) &&
          (!authFilter || p.auth === authFilter) &&
          stockMatches(p, stockFilter)
        )
      }}
      toolbar={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Buscar producto, SKU, marca o tienda..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            value={sellerFilter}
            onChange={setSellerFilter}
            width={210}
            ariaLabel="Filtrar por tienda"
            options={[{ value: '', label: 'Todas las tiendas' }, ...sellers.map((s) => ({ value: s.id, label: s.storeName }))]}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            width={190}
            ariaLabel="Filtrar por categoría"
            options={[{ value: '', label: 'Todas las categorías' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Select
            value={authFilter}
            onChange={setAuthFilter}
            width={190}
            ariaLabel="Filtrar por autenticación"
            options={AUTH_OPTIONS}
          />
          <Select
            value={stockFilter}
            onChange={setStockFilter}
            width={160}
            ariaLabel="Filtrar por stock"
            options={STOCK_OPTIONS}
          />
        </div>
      }
      columns={[
        {
          header: 'Producto',
          cell: (p) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
              <img src={p.images[0]} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid var(--border)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</div>
                <div className="mono mute">{p.brand}</div>
              </div>
            </div>
          ),
        },
        { header: 'Tienda', cell: (p) => <span className="mono mute">{storeName(p.sellerId)}</span> },
        { header: 'SKU', cell: (p) => <span className="mono mute">{p.sku}</span> },
        { header: 'Categoría', cell: (p) => <span className="mono mute">{categoryName(p.categoryId ?? p.category)}</span> },
        { header: 'Precio', cell: (p) => <span className="mono">${p.price}</span> },
        {
          header: 'Stock',
          cell: (p) => (
            p.soldOut
              ? <span className="pill red">AGOTADO</span>
              : p.lowStock > 0
                ? <span className="pill yellow">BAJO · {p.totalStock}</span>
                : <span className="pill green">{p.totalStock}</span>
          ),
        },
        {
          header: 'Autenticación',
          cell: (p) => <span className={authPill(p.auth)}>{AUTH_LABELS[p.auth] ?? p.auth}</span>,
        },
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

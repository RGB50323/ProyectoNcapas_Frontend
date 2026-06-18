// Capa de datos: único punto de cambio a la API real de Spring Boot
import type {
  Product,
  Category,
  Coupon,
  ShippingMethod,
  Drop,
  Order,
  Review,
  Variant,
  Condition,
  AuthStatus,
  BrandOption,
  ProductImage
} from './types'

import {
  PRODUCTS,
  CATEGORIES,
  BRANDS,
  COUPONS,
  SHIPPING,
  DROPS,
  ORDERS,
  REVIEWS,
  stripeImg,
} from './mock-data'

import { authFetch, type Session } from './auth'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'

const USE_MOCK = false

type ApiResponse<T> = {
  data: T
  message: string
  status: number
  time: string
  uri: string
}

type WriteMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ProductBody = Record<string, unknown>
export type ProductVariantBody = Record<string, unknown>
export type ProductImageBody = Record<string, unknown>

type BackendProduct = {
  id: string
  sellerId: string
  sellerStoreName: string
  categoryId: string
  categoryName: string
  brandId: string
  brandName: string
  sku: string
  name: string
  slug: string
  description: string
  price: number
  condition: Condition
  conditionScore: number
  authStatus: string
  featured: boolean
  newProduct: boolean
  limited: boolean
  privateDrop: boolean
  totalStock: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string | null
}

type BackendCategory = {
  id: string
  name: string
  units: number
  parentId: string | null
}

type BackendBrand = {
  id: string
  name: string
  slug: string
  logoUrl: string
}

type BackendVariant = {
  id: string
  productId: string
  productName: string
  productSku: string
  productSlug: string
  size: string
  colorName: string
  colorHex: string
  stock: number
  priceDelta: number
}

type BackendImage = {
  id: string
  productId: string
  productName: string
  productSku: string
  productSlug: string
  url: string
  altText: string
  primaryImage: boolean
  sortOrder: number
}

type BackendProductBadge = {
  id: string
  productId: string
  productName: string
  label: string
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`[API] GET ${path} -> ${res.status}`)
  }

  return res.json() as Promise<T>
}

async function getProductBadgesOptional(): Promise<BackendProductBadge[]> {
  try {
    const response = await apiGet<ApiResponse<BackendProductBadge[]>>('/product-badges/')
    return response.data
  } catch {
    return []
  }
}

async function apiWrite<T>(
  path: string,
  token: string,
  method: WriteMethod,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      json?.message ||
      json?.error ||
      `Error ${res.status} al procesar la solicitud`

    throw new Error(
      typeof message === 'string'
        ? message
        : Object.values(message).join('. ')
    )
  }

  return json?.data as T
}

function mapAuthStatus(authStatus: string): AuthStatus {
  if (authStatus === 'NOT_SUBMITTED') return 'NOT_SUBMITTED'
  if (authStatus === 'PENDING') return 'PENDING'
  if (authStatus === 'AUTHENTICATED') return 'AUTHENTICATED'
  if (authStatus === 'REJECTED') return 'REJECTED'

  return 'NOT_SUBMITTED'
}

function mapProduct(
  product: BackendProduct,
  allVariants: BackendVariant[],
  allImages: BackendImage[],
  allBadges: BackendProductBadge[] = []
): Product {
  const productVariants = allVariants.filter(
    (variant) => variant.productId === product.id
  )

  const productImages = allImages
    .filter((image) => image.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const variants: Variant[] = productVariants.map((variant) => ({
    id: variant.id,
    productId: variant.productId,
    size: variant.size,
    color: variant.colorName,
    colorHex: variant.colorHex,
    stock: variant.stock,
    priceDelta: variant.priceDelta,
  }))

  const sizes = Array.from(
    new Set(productVariants.map((variant) => variant.size))
  )

  const colors = Array.from(
    new Map(
      productVariants.map((variant) => [
        variant.colorName,
        {
          name: variant.colorName,
          hex: variant.colorHex,
        },
      ])
    ).values()
  )

  const badges: string[] = []
  const addBadge = (label?: string) => {
    const clean = label?.trim()
    if (!clean) return
    if (!badges.some((badge) => badge.toLowerCase() === clean.toLowerCase())) {
      badges.push(clean)
    }
  }

  if (product.featured) addBadge('Destacado')
  if (product.newProduct) addBadge('Nuevo')
  if (product.limited) addBadge('Limitado')
  if (product.privateDrop) addBadge('Drop privado')
  if (product.authStatus === 'AUTHENTICATED') addBadge('Verificado')

  allBadges
    .filter((badge) => badge.productId === product.id)
    .forEach((badge) => addBadge(badge.label))

  const calculatedTotalStock = variants.reduce(
    (sum, variant) => sum + variant.stock,
    0
  )

  const hasLowStockVariant = variants.some(
    (variant) => variant.stock > 0 && variant.stock <= 2
  )

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brandName,
    category: product.categoryId,
    price: product.price,
    condition: product.condition,
    auth: mapAuthStatus(product.authStatus),
    badges,
    featured: product.featured,
    isNew: product.newProduct,
    limited: product.limited,
    privateDrop: product.privateDrop,
    images:
      productImages.length > 0
        ? productImages.map((image) => image.url)
        : ['/placeholder.svg'],
    sizes,
    colors,
    rating: product.rating,
    reviews: product.reviewCount,
    desc: product.description,
    variants,
    totalStock: calculatedTotalStock,
    lowStock: hasLowStockVariant ? 1 : 0,
    soldOut: calculatedTotalStock <= 0,
    sellerId: product.sellerId,
    categoryId: product.categoryId,
    brandId: product.brandId,
    slug: product.slug,
    productImages: productImages.map((image) => ({
      id: image.id,
      productId: image.productId,
      url: image.url,
      altText: image.altText,
      primaryImage: image.primaryImage,
      sortOrder: image.sortOrder,
    })),
  }
}

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) return PRODUCTS

  const [productsRes, variantsRes, imagesRes, productBadges] = await Promise.all([
    apiGet<ApiResponse<BackendProduct[]>>('/products/'),
    apiGet<ApiResponse<BackendVariant[]>>('/product-variants/'),
    apiGet<ApiResponse<BackendImage[]>>('/product-images/'),
    getProductBadgesOptional(),
  ])

  return productsRes.data.map((product) =>
    mapProduct(product, variantsRes.data, imagesRes.data, productBadges)
  )
}

export async function getMyProducts(session: Session): Promise<Product[]> {
  const [mineRes, variantsRes, imagesRes, productBadges] = await Promise.all([
    authFetch('/products/my', session).then((r) => r.json() as Promise<ApiResponse<BackendProduct[]>>),
    apiGet<ApiResponse<BackendVariant[]>>('/product-variants/'),
    apiGet<ApiResponse<BackendImage[]>>('/product-images/'),
    getProductBadgesOptional(),
  ])

  return mineRes.data.map((product) =>
    mapProduct(product, variantsRes.data, imagesRes.data, productBadges)
  )
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (USE_MOCK) return PRODUCTS.find((product) => product.id === id)

  const products = await getProducts()

  return products.find(
    (product) => product.id === id || product.sku === id
  )
}

export async function getPublicProducts(): Promise<Product[]> {
  const products = await getProducts()
  return products.filter((product) => product.auth === 'AUTHENTICATED')
}

export async function getPublicProduct(id: string): Promise<Product | undefined> {
  const products = await getPublicProducts()

  return products.find(
    (product) => product.id === id || product.sku === id
  )
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const products = await getPublicProducts()
  return products.filter((product) => product.category === categoryId)
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return CATEGORIES

  const response = await apiGet<ApiResponse<BackendCategory[]>>('/categories/')

  return response.data.map((category) => ({
    id: category.id,
    name: category.name,
    count: category.units,
  }))
}

export async function getBrands(): Promise<string[]> {
  if (USE_MOCK) return BRANDS

  const response = await apiGet<ApiResponse<BackendBrand[]>>('/brands/')

  return response.data.map((brand) => brand.name)
}

export async function getBrandOptions(): Promise<BrandOption[]> {
  if (USE_MOCK) {
    return BRANDS.map((brand) => ({
      id: brand,
      name: brand,
      slug: brand.toLowerCase().replace(/\s+/g, '-'),
      logoUrl: '',
    }))
  }

  const response = await apiGet<ApiResponse<BackendBrand[]>>('/brands/')

  return response.data.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoUrl: brand.logoUrl,
  }))
}

export async function uploadProductImage(file: File, token: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/product-images/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor (¿backend encendido?).')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al subir la imagen (¿reiniciaste el backend?).`)
  }
  return json?.data?.url as string
}

export async function createProduct(body: ProductBody, token: string): Promise<{ id: string }> {
  return apiWrite('/products/create', token, 'POST', body)
}

export async function patchProduct(id: string, body: ProductBody, token: string): Promise<unknown> {
  return apiWrite(`/products/patch/${id}`, token, 'PATCH', body)
}

export async function createProductVariant(body: ProductVariantBody, token: string): Promise<unknown> {
  return apiWrite('/product-variants/create', token, 'POST', body)
}

export async function patchProductVariant(id: string, body: ProductVariantBody, token: string): Promise<unknown> {
  return apiWrite(`/product-variants/patch/${id}`, token, 'PATCH', body)
}

export async function deleteProductVariant(id: string, token: string): Promise<unknown> {
  return apiWrite(`/product-variants/${id}`, token, 'DELETE')
}

export async function createProductImage(body: ProductImageBody, token: string): Promise<unknown> {
  return apiWrite('/product-images/create', token, 'POST', body)
}

export async function patchProductImage(id: string, body: ProductImageBody, token: string): Promise<unknown> {
  return apiWrite(`/product-images/patch/${id}`, token, 'PATCH', body)
}

export async function deleteProductImage(id: string, token: string): Promise<unknown> {
  return apiWrite(`/product-images/${id}`, token, 'DELETE')
}

export async function deleteProduct(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.message || json?.error || 'No se pudo eliminar el producto')
  }
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (USE_MOCK) return REVIEWS

  return REVIEWS
}

export async function getCoupons(): Promise<Coupon[]> {
  if (USE_MOCK) return COUPONS

  return COUPONS
}

export async function findCoupon(code: string): Promise<Coupon | undefined> {
  const list = await getCoupons()

  return list.find(
    (coupon) =>
      coupon.code.toUpperCase() === code.trim().toUpperCase() && coupon.active
  )
}

type BackendShipping = {
  id: string
  name: string
  fee: number
  eta: string
  active: boolean
}

type BackendDrop = {
  id: string
  title: string
  slug: string
  dropDate: string
  units: number
  type: 'PUBLIC' | 'PRIVATE'
  coverImageUrl: string
  active: boolean
}

const DROP_MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function formatDropDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${DROP_MONTHS[d.getMonth()]} · ${hh}:${mm}`
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  if (USE_MOCK) return SHIPPING

  const response = await apiGet<ApiResponse<BackendShipping[]>>('/shipping-methods/')

  return response.data
    .filter((m) => m.active)
    .map((m) => ({ id: m.id, name: m.name, fee: Number(m.fee), eta: m.eta }))
}

export async function getDrops(): Promise<Drop[]> {
  if (USE_MOCK) return DROPS

  const response = await apiGet<ApiResponse<BackendDrop[]>>('/drops/')

  return response.data
    .filter((d) => d.active)
    .map((d) => ({
      id: d.id,
      title: d.title,
      date: formatDropDate(d.dropDate),
      units: d.units ?? 0,
      type: d.type === 'PRIVATE' ? 'DROP PRIVADO' : 'PÚBLICO',
      img: d.coverImageUrl || stripeImg(d.title, '#1b1b1b', '#111111', '#e8e3d6'),
    }))
}

export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK) return ORDERS

  return ORDERS
}
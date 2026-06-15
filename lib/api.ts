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
} from './mock-data'

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

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`[API] GET ${path} -> ${res.status}`)
  }

  return res.json() as Promise<T>
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
  allImages: BackendImage[]
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

  if (product.featured) badges.push('Destacado')
  if (product.newProduct) badges.push('Nuevo')
  if (product.limited) badges.push('Limitado')
  if (product.privateDrop) badges.push('Drop privado')
  if (product.authStatus === 'AUTHENTICATED') badges.push('Verificado')

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

  const [productsRes, variantsRes, imagesRes] = await Promise.all([
    apiGet<ApiResponse<BackendProduct[]>>('/products/'),
    apiGet<ApiResponse<BackendVariant[]>>('/product-variants/'),
    apiGet<ApiResponse<BackendImage[]>>('/product-images/'),
  ])

  return productsRes.data.map((product) =>
    mapProduct(product, variantsRes.data, imagesRes.data)
  )
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (USE_MOCK) return PRODUCTS.find((product) => product.id === id)

  const products = await getProducts()

  return products.find(
    (product) => product.id === id || product.sku === id
  )
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const products = await getProducts()
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

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  if (USE_MOCK) return SHIPPING

  return SHIPPING
}

export async function getDrops(): Promise<Drop[]> {
  if (USE_MOCK) return DROPS

  return DROPS
}

export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK) return ORDERS

  return ORDERS
}
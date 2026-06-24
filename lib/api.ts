import type {
  Product,
  Category,
  Coupon,
  ShippingMethod,
  Drop,
  Order,
  Review,
  ReviewPhoto,
  ReviewableProduct,
  Variant,
  Condition,
  AuthStatus,
  BrandOption,
  Verification,
  StockAlert,
  Invoice,
  Shipment,
  OrderItem
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

import { formatDateSV } from './datetime'

import { authFetch, getUserId, type Session } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

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
    (variant) => variant.stock > 0 && variant.stock <= 3
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

export async function getRecommendedProducts(session?: Session | null, limit?: number): Promise<Product[]> {
  if (USE_MOCK) {
    const mockRecommended = PRODUCTS.filter((product) => product.auth === 'AUTHENTICATED')
    return limit !== undefined && limit <= 0 ? mockRecommended : mockRecommended.slice(0, limit ?? 12)
  }

  const path = limit === undefined ? '/products/recommended' : `/products/recommended?limit=${limit}`

  const recommendedPromise = session
    ? authFetch(path, session).then((r) => r.json() as Promise<ApiResponse<BackendProduct[]>>)
    : apiGet<ApiResponse<BackendProduct[]>>(path)

  const [recommendedRes, variantsRes, imagesRes, productBadges] = await Promise.all([
    recommendedPromise,
    apiGet<ApiResponse<BackendVariant[]>>('/product-variants/'),
    apiGet<ApiResponse<BackendImage[]>>('/product-images/'),
    getProductBadgesOptional(),
  ])

  return recommendedRes.data.map((product) =>
    mapProduct(product, variantsRes.data, imagesRes.data, productBadges)
  )
}

export async function registerProductView(productId: string, session: Session): Promise<void> {
  const res = await authFetch(`/products/${productId}/view`, session, {
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error(`Error ${res.status} al registrar la vista`)
  }
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
  try {
    if (USE_MOCK) return PRODUCTS.filter((product) => product.auth === 'AUTHENTICATED')

    const [productsRes, variantsRes, imagesRes, productBadges] = await Promise.all([
      apiGet<ApiResponse<BackendProduct[]>>('/products/public'),
      apiGet<ApiResponse<BackendVariant[]>>('/product-variants/public'),
      apiGet<ApiResponse<BackendImage[]>>('/product-images/public'),
      getProductBadgesOptional(),
    ])

    return productsRes.data.map((product) =>
      mapProduct(product, variantsRes.data, imagesRes.data, productBadges)
    )
  } catch {
    return []
  }
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

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const res = await apiGet<ApiResponse<Review[]>>(`/reviews/product/${productId}`)
  return res.data
}

export async function getAllReviews(): Promise<Review[]> {
  const res = await apiGet<ApiResponse<Review[]>>('/reviews/')
  return res.data
}

export async function getReviewById(id: string): Promise<Review> {
  const res = await apiGet<ApiResponse<Review>>(`/reviews/${id}`)
  return res.data
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  const res = await apiGet<ApiResponse<Review[]>>(`/reviews/user/${userId}`)
  return res.data
}

export async function getReviewsBySeller(sellerId: string, token: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE_URL}/reviews/seller/${sellerId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al cargar las reviews`)
  }
  return json.data as Review[]
}

export async function createReview(body: {
  productId: string
  userId: string
  rating: number
  body: string
}, token: string): Promise<Review> {
  return apiWrite('/reviews/create', token, 'POST', body)
}

export async function getReviewableProducts(userId: string, token: string): Promise<ReviewableProduct[]> {
  const res = await fetch(`${API_BASE_URL}/reviews/reviewable-products/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al cargar los productos`)
  }
  return json.data as ReviewableProduct[]
}

export async function updateReview(id: string, body: {
  rating: number
  title: string
  body: string
}, token: string): Promise<Review> {
  return apiWrite(`/reviews/update/${id}`, token, 'PUT', body)
}

export async function patchReview(id: string, body: {
  rating?: number
  body?: string
}, token: string): Promise<Review> {
  return apiWrite(`/reviews/patch/${id}`, token, 'PATCH', body)
}

export async function deleteReview(id: string, token: string): Promise<void> {
  await apiWrite(`/reviews/${id}`, token, 'DELETE')
}

export async function getAllReviewPhotos(): Promise<ReviewPhoto[]> {
  const res = await apiGet<ApiResponse<ReviewPhoto[]>>('/review-photos/')
  return res.data
}

export async function getReviewPhotoById(id: string): Promise<ReviewPhoto> {
  const res = await apiGet<ApiResponse<ReviewPhoto>>(`/review-photos/${id}`)
  return res.data
}

export async function getReviewPhotosByReview(reviewId: string): Promise<ReviewPhoto[]> {
  const res = await apiGet<ApiResponse<ReviewPhoto[]>>(`/review-photos/review/${reviewId}`)
  return res.data
}

export async function createReviewPhoto(body: {
  reviewId: string
  url: string
  sortOrder?: number
}, token: string): Promise<ReviewPhoto> {
  return apiWrite('/review-photos/create', token, 'POST', body)
}

export async function uploadReviewPhoto(file: File, token: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${API_BASE_URL}/review-photos/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(json?.message || `Error ${res.status} al subir la foto`)
  return json?.data?.url as string
}

export async function updateReviewPhoto(id: string, body: {
  url: string
  sortOrder: number
}, token: string): Promise<ReviewPhoto> {
  return apiWrite(`/review-photos/update/${id}`, token, 'PUT', body)
}

export async function patchReviewPhoto(id: string, body: {
  url?: string
  sortOrder?: number
}, token: string): Promise<ReviewPhoto> {
  return apiWrite(`/review-photos/patch/${id}`, token, 'PATCH', body)
}

export async function deleteReviewPhoto(id: string, token: string): Promise<void> {
  await apiWrite(`/review-photos/${id}`, token, 'DELETE')
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

export async function getOrdersByCustomer(session: Session): Promise<Order[]> {
  try {
    const userId = getUserId(session)
    if (!userId) return []

    const res = await authFetch(`/orders/customer/${userId}`, session)
    const json = await res.json()
    const data = json?.data ?? []

    return data.map((o: any) => ({
      id: o.id,
      status: o.status,
      date: formatDateSV(o.createdAt),
      total: o.total,
      items: 0,
      tracking: o.trackingNumber ?? '—',
      customerId: o.customerId,
      customerFullName: o.customerFullName,
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      discountAmount: o.discountAmount,
      couponCode: o.couponCode ?? undefined,
      shippingMethodName: o.shippingMethodName ?? undefined,
      shippingAddressStreet: o.shippingAddressStreet ?? undefined,
      shippingAddressCity: o.shippingAddressCity ?? undefined,
      shippingAddressCountry: o.shippingAddressCountry ?? undefined,
      notes: o.notes ?? undefined,
    }))
  } catch {
    return []
  }
}

export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK) return ORDERS

  return ORDERS
}

export async function getOrderItems(orderId: string, session: Session): Promise<OrderItem[]> {
  const res = await authFetch(`/order-items/order/${orderId}`, session)
  const json = await res.json()
  return json?.data ?? []
}

export async function patchOrder(
  orderId: string,
  body: Record<string, unknown>,
  session: Session
): Promise<Order> {
  const res = await authFetch(`/orders/patch/${orderId}`, session, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Error al actualizar el pedido')
  return json?.data as Order
}

export async function requestRefund(orderId: string, session: Session): Promise<Order> {
  const res = await authFetch(`/orders/${orderId}/refund`, session, { method: 'POST' })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || 'Error al procesar la devolución')
  return json?.data as Order
}

export async function getVerifications(token: string): Promise<Verification[]> {
  const res = await fetch(`${API_BASE_URL}/verifications/`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json()
  return json.data as Verification[]
}

export async function getVerificationsByProduct(productId: string, token: string): Promise<Verification[]> {
  const res = await fetch(`${API_BASE_URL}/verifications/product/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json()
  return json.data as Verification[]
}

export async function createVerification(body: Record<string, unknown>, token: string): Promise<Verification> {
  return apiWrite('/verifications/create', token, 'POST', body)
}

export async function updateVerification(id: string, body: Record<string, unknown>, token: string): Promise<Verification> {
  return apiWrite(`/verifications/update/${id}`, token, 'PUT', body)
}


export async function deleteVerification(id: string, token: string): Promise<void> {
  await apiWrite(`/verifications/${id}`, token, 'DELETE')
}

export async function getVerificationById(id: string, token: string): Promise<Verification> {
  const res = await fetch(`${API_BASE_URL}/verifications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  const json = await res.json()
  return json.data as Verification
}

export async function getMyStockAlerts(session: Session): Promise<StockAlert[]> {
  try {
    const userId = getUserId(session)
    if (!userId) return []
    const res = await authFetch(`/stock-alerts/user/${userId}`, session)
    const json = await res.json()
    return json?.data ?? []
  } catch {
    return []
  }
}

export async function createStockAlert(
  productId: string,
  session: Session
): Promise<void> {
  await authFetch('/stock-alerts/create', session, {
    method: 'POST',
    body: JSON.stringify({
      userId: getUserId(session),
      productId,
    }),
  })
}

export async function deleteStockAlert(
  id: string,
  session: Session
): Promise<void> {
  await authFetch(`/stock-alerts/${id}`, session, { method: 'DELETE' })
}

export async function getInvoiceByOrder(orderId: string, session: Session): Promise<Invoice> {
  const res = await authFetch(`/invoices/order/${orderId}`, session)
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al cargar la factura`)
  }
  return json.data as Invoice
}

export async function resendInvoiceEmail(orderId: string, session: Session): Promise<Invoice> {
  const res = await authFetch(`/invoices/order/${orderId}/email`, session, { method: 'POST' })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al reenviar la factura`)
  }
  return json.data as Invoice
}

async function downloadFile(path: string, session: Session, fileName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Error ${res.status} al descargar ${fileName}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadInvoicePdf(orderId: string, session: Session): Promise<void> {
  await downloadFile(`/invoices/order/${orderId}/pdf`, session, `factura-${orderId}.pdf`)
}

export async function downloadInvoiceXml(orderId: string, session: Session): Promise<void> {
  await downloadFile(`/invoices/order/${orderId}/xml`, session, `factura-${orderId}.xml`)
}

export async function getShipmentTracking(orderId: string, session: Session): Promise<Shipment> {
  const res = await authFetch(`/shipments/order/${orderId}`, session)
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || json?.error || `Error ${res.status} al cargar el envio`)
  }
  return json.data as Shipment
}

export type Condition = 'NEW' | 'LIKE_NEW' | 'USED' | 'REFURBISHED'
export type AuthStatus =
    | 'NOT_SUBMITTED'
    | 'PENDING'
    | 'AUTHENTICATED'
    | 'REJECTED'
export type DiscountType = 'PERCENT' | 'FIXED' | 'SHIPPING' | 'BOGO'
export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'NEW'
    | 'PAID'
    | 'PREPARING'
    | 'RETURN_REQUESTED'

export type VerificationStageStatus = 'PENDING' | 'PASSED' | 'FAILED'

export interface ProductColor {
  name: string
  hex: string
}

export interface Variant {
  id?: string
  productId?: string
  size: string
  color: string
  colorHex: string
  stock: number
  priceDelta: number
}

export interface ProductImage {
  id: string
  productId: string
  url: string
  altText?: string
  primaryImage: boolean
  sortOrder: number
}

export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  category: string
  price: number
  condition: Condition
  auth: AuthStatus
  badges: string[]
  featured: boolean
  isNew: boolean
  limited: boolean
  privateDrop: boolean
  images: string[]
  sizes: string[]
  colors: ProductColor[]
  rating: number
  reviews: number
  desc: string
  variants: Variant[]
  totalStock: number
  lowStock: number
  soldOut: boolean
  imageId?: string
  categoryId?: string
  brandId?: string
  sellerId?: string
  slug?: string
  productImages?: ProductImage[]
}

export interface Category {
  id: string
  name: string
  count: number
}

export interface Coupon {
  code: string
  label: string
  type: DiscountType
  value: number
  active: boolean
  uses: number
  max: number
}

export interface ShippingMethod {
  id: string
  name: string
  fee: number
  eta: string
}

export interface Drop {
  id: string
  title: string
  date: string
  units: number
  type: string
  img: string
}

export interface Order {
  id: string
  status: OrderStatus
  date: string
  total: number
  items: number
  tracking: string
  customerId?: string
  customerFullName?: string
  subtotal?: number
  shippingCost?: number
  discountAmount?: number
  couponCode?: string
  shippingMethodName?: string
  shippingAddressStreet?: string
  shippingAddressCity?: string
  shippingAddressCountry?: string
  notes?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  variantId: string | null
  variantSize: string | null
  variantColorName: string | null
  sellerId: string
  sellerStoreName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Payment {
  id: string
  orderId: string
  orderTotal: number
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  amount: number
  transactionId: string | null
  paidAt: string | null
  createdAt: string
}

export interface StockAlert {
  id: string
  userId: string
  userFullName: string
  productId: string
  productName: string
  notifiedAt: string
}

export interface Review {
  name: string
  date: string
  rating: number
  text: string
  photos: number
}

export interface CartLine {
  product: Product
  qty: number
  size: string
  color: string
}

export interface CartItem {
  id: string
  productId: string
  productName: string
  productSku: string
  variantId: string
  variantSize: string
  variantColorName: string
  variantColorHex: string
  quantity: number
  unitPrice: number
  lineTotal: number
  sellerId?: string // para crear OrderItems en el checkout
}

export interface WishlistItem {
  id: string
  productId: string
  productName: string
  productSku: string
}

export interface CouponPreview {
  couponId: string
  couponCode: string
  discountType: string
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
}

export interface BrandOption {
  id: string
  name: string
  slug: string
  logoUrl: string
}

export interface Verification {
  id: string
  productId: string
  productName: string
  verifiedById: string
  verifiedByFirstName: string
  verifiedByLastName: string
  materialCheck: VerificationStageStatus
  constructionCheck: VerificationStageStatus
  factoryCodeCheck: VerificationStageStatus
  finalInspection: VerificationStageStatus
  notes: string | null
  verifiedAt: string | null
  createdAt: string
}
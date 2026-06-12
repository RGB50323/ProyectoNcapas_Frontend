export type Condition = 'NEW' | 'PRE_OWNED_EXCELLENT' | 'PRE_OWNED_GOOD' | 'COLLECTOR_ITEM'
export type AuthStatus = 'VERIFIED' | 'PENDING' | 'NOT_REQUIRED'
export type DiscountType = 'PERCENT' | 'FIXED' | 'SHIPPING' | 'BOGO'
export type OrderStatus =
  | 'NEW' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED'
  | 'RETURN_REQUESTED' | 'REFUNDED' | 'CANCELLED'

export interface ProductColor {
  name: string
  hex: string
}

export interface Variant {
  size: string
  color: string
  colorHex: string
  stock: number
  priceDelta: number
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

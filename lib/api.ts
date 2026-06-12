// Capa de datos: único punto de cambio a la API real de Spring Boot (NEXT_PUBLIC_API_URL)
import type { Product, Category, Coupon, ShippingMethod, Drop, Order, Review } from './types'
import {
  PRODUCTS, CATEGORIES, BRANDS, COUPONS, SHIPPING, DROPS, ORDERS, REVIEWS,
} from './mock-data'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const USE_MOCK = !API_BASE_URL

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`[API] GET ${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

export async function getProducts(): Promise<Product[]> {
  if (USE_MOCK) return PRODUCTS
  return apiGet<Product[]>('/products')
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (USE_MOCK) return PRODUCTS.find((p) => p.id === id)
  return apiGet<Product>(`/products/${id}`)
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (USE_MOCK) return PRODUCTS.filter((p) => p.category === categoryId)
  return apiGet<Product[]>(`/products?category=${categoryId}`)
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return CATEGORIES
  return apiGet<Category[]>('/categories')
}

export async function getBrands(): Promise<string[]> {
  if (USE_MOCK) return BRANDS
  return apiGet<string[]>('/brands')
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (USE_MOCK) return REVIEWS
  return apiGet<Review[]>(`/products/${productId}/reviews`)
}

export async function getCoupons(): Promise<Coupon[]> {
  if (USE_MOCK) return COUPONS
  return apiGet<Coupon[]>('/coupons')
}

export async function findCoupon(code: string): Promise<Coupon | undefined> {
  const list = await getCoupons()
  return list.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active)
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  if (USE_MOCK) return SHIPPING
  return apiGet<ShippingMethod[]>('/shipping-methods')
}

export async function getDrops(): Promise<Drop[]> {
  if (USE_MOCK) return DROPS
  return apiGet<Drop[]>('/drops')
}

export async function getOrders(): Promise<Order[]> {
  if (USE_MOCK) return ORDERS
  return apiGet<Order[]>('/orders')
}

import { authFetch, type Session, type Role } from './auth'
import type { Review, ReviewPhoto } from './types'

export type DiscountType = string
export type DropType = 'PUBLIC' | 'PRIVATE'

export interface DiscountTypeInfo {
  value: string
  label: string
  usesValue: boolean
}

export interface AdminUser {
  uuid: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: Role
}

export interface AdminSeller {
  id: string
  storeName: string
  storeDescription: string
  rating: number | null
  totalSales: number
  verified: boolean
  user: { uuid: string; firstName: string; lastName: string; email: string; phone: string | null; role: Role }
}

export interface AdminCategory {
  id: string
  name: string
  units: number
  parentId: string | null
}

export interface AdminBrand {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

export interface AdminShipping {
  id: string
  name: string
  fee: number
  eta: string
  active: boolean
}

export interface AdminCoupon {
  id: string
  code: string
  label: string
  type: DiscountType
  value: number
  minOrderAmount: number | null
  maxUses: number | null
  usesCount: number
  active: boolean
  expiresAt: string | null
}

export interface AdminDrop {
  id: string
  title: string
  slug: string
  dropDate: string
  units: number
  type: DropType
  coverImageUrl: string | null
  active: boolean
}

export interface AdminProductBadge {
  id: string
  productId: string
  productName: string
  label: string
}

export interface AdminOrder {
  id: string
  customerId: string
  customerFullName: string
  shippingAddressStreet: string | null
  shippingAddressCity: string | null
  shippingAddressCountry: string | null
  shippingMethodName: string | null
  couponCode: string | null
  status: string
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
  trackingNumber: string | null
  notes: string | null
  createdAt: string
}

export interface AdminOrderItem {
  id: string
  orderId: string
  productName: string
  variantSize: string | null
  variantColorName: string | null
  sellerId: string | null
  sellerStoreName: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface AdminAddress {
  id: string
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = json?.message
    if (typeof msg === 'string') throw new Error(msg)
    if (msg && typeof msg === 'object') throw new Error(Object.values(msg).join('. '))
    throw new Error(`Error ${res.status}`)
  }
  return json?.data as T
}

function list<T>(session: Session, path: string) {
  return authFetch(path, session).then((r) => unwrap<T[]>(r))
}
function create(session: Session, path: string, body: unknown) {
  return authFetch(path, session, { method: 'POST', body: JSON.stringify(body) }).then(unwrap)
}
function put(session: Session, path: string, body: unknown) {
  return authFetch(path, session, { method: 'PUT', body: JSON.stringify(body) }).then(unwrap)
}
function patch(session: Session, path: string, body: unknown) {
  return authFetch(path, session, { method: 'PATCH', body: JSON.stringify(body) }).then(unwrap)
}
function del(session: Session, path: string) {
  return authFetch(path, session, { method: 'DELETE' }).then(unwrap)
}

export const admin = {
  listUsers: (s: Session) => list<AdminUser>(s, '/users/'),
  getUser: (s: Session, id: string) => authFetch(`/users/${id}`, s).then((r) => unwrap<AdminUser>(r)),
  changeRole: (s: Session, id: string, role: Role) => patch(s, `/users/${id}/role`, { role }),
  deleteUser: (s: Session, id: string) => del(s, `/users/${id}`),

  listOrders: (s: Session) => list<AdminOrder>(s, '/orders/'),
  ordersByCustomer: (s: Session, customerId: string) => list<AdminOrder>(s, `/orders/customer/${customerId}`),
  orderItems: (s: Session, orderId: string) => list<AdminOrderItem>(s, `/order-items/order/${orderId}`),
  patchOrder: (s: Session, id: string, status: string) => patch(s, `/orders/patch/${id}`, { status }), // ← nuevo
  addressesByUser: (s: Session, userId: string) => list<AdminAddress>(s, `/addresses/user/${userId}`),

  listSellers: (s: Session) => list<AdminSeller>(s, '/seller_profiles/'),
  updateSeller: (s: Session, id: string, body: { storeName: string; storeDescription: string }) =>
      put(s, `/seller_profiles/update/${id}`, body),
  verifySeller: (s: Session, id: string, verified: boolean) => patch(s, `/seller_profiles/${id}/verify`, { verified }),
  deleteSeller: (s: Session, id: string) => del(s, `/seller_profiles/${id}`),

  listCategories: (s: Session) => list<AdminCategory>(s, '/categories/'),
  createCategory: (s: Session, b: unknown) => create(s, '/categories/create', b),
  updateCategory: (s: Session, id: string, b: unknown) => put(s, `/categories/update/${id}`, b),
  deleteCategory: (s: Session, id: string) => del(s, `/categories/${id}`),

  listBrands: (s: Session) => list<AdminBrand>(s, '/brands/'),
  createBrand: (s: Session, b: unknown) => create(s, '/brands/create', b),
  updateBrand: (s: Session, id: string, b: unknown) => put(s, `/brands/update/${id}`, b),
  deleteBrand: (s: Session, id: string) => del(s, `/brands/${id}`),

  listShipping: (s: Session) => list<AdminShipping>(s, '/shipping-methods/'),
  createShipping: (s: Session, b: unknown) => create(s, '/shipping-methods/create', b),
  updateShipping: (s: Session, id: string, b: unknown) => put(s, `/shipping-methods/update/${id}`, b),
  deleteShipping: (s: Session, id: string) => del(s, `/shipping-methods/${id}`),

  listDiscountTypes: (s: Session) => list<DiscountTypeInfo>(s, '/coupons/discount-types'),
  listCoupons: (s: Session) => list<AdminCoupon>(s, '/coupons/'),
  createCoupon: (s: Session, b: unknown) => create(s, '/coupons/create', b),
  updateCoupon: (s: Session, id: string, b: unknown) => put(s, `/coupons/update/${id}`, b),
  deleteCoupon: (s: Session, id: string) => del(s, `/coupons/${id}`),

  listDrops: (s: Session) => list<AdminDrop>(s, '/drops/'),
  createDrop: (s: Session, b: unknown) => create(s, '/drops/create', b),
  updateDrop: (s: Session, id: string, b: unknown) => put(s, `/drops/update/${id}`, b),
  deleteDrop: (s: Session, id: string) => del(s, `/drops/${id}`),

  createProduct: (s: Session, b: unknown) => create(s, '/products/create', b),
  updateProduct: (s: Session, id: string, b: unknown) => put(s, `/products/update/${id}`, b),

  listProductBadges: (s: Session) => list<AdminProductBadge>(s, '/product-badges/'),
  createProductBadge: (s: Session, b: unknown) => create(s, '/product-badges/create', b),
  updateProductBadge: (s: Session, id: string, b: unknown) => put(s, `/product-badges/update/${id}`, b),
  deleteProductBadge: (s: Session, id: string) => del(s, `/product-badges/${id}`),

  listReviews: (s: Session) => list<Review>(s, '/reviews/'),
  deleteReview: (s: Session, id: string) => del(s, `/reviews/${id}`),
  reviewPhotosByReview: (s: Session, reviewId: string) => list<ReviewPhoto>(s, `/review-photos/review/${reviewId}`),
  deleteReviewPhoto: (s: Session, id: string) => del(s, `/review-photos/${id}`),
}
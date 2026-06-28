import { authFetch, type Session, type Role } from './auth'

export type StoreRequestStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
export type StoreCategory =
  | 'SNEAKERS'
  | 'STREETWEAR'
  | 'ROPA'
  | 'ACCESORIOS'
  | 'COLECCIONABLES'
  | 'OTRO'

export interface StoreRequest {
  id: string
  storeName: string
  storeDescription: string
  storeCategory: StoreCategory
  location: string
  monthlySalesEstimate: number
  status: StoreRequestStatus
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
  eligibleToReapply: boolean
  nextEligibleAt: string | null
  user: {
    uuid: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    role: Role
  }
}

export interface CreateStoreRequestBody {
  storeName: string
  storeDescription: string
  storeCategory: StoreCategory
  location: string
  monthlySalesEstimate: number
}

// etiquetas en español para el rubro de la tienda
export const STORE_CATEGORY_LABELS: Record<StoreCategory, string> = {
  SNEAKERS: 'Sneakers',
  STREETWEAR: 'Streetwear',
  ROPA: 'Ropa',
  ACCESORIOS: 'Accesorios',
  COLECCIONABLES: 'Coleccionables',
  OTRO: 'Otro',
}

export const STORE_STATUS_LABELS: Record<StoreRequestStatus, string> = {
  PENDIENTE: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
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

export async function getStoreCategories(session: Session): Promise<StoreCategory[]> {
  return unwrap<StoreCategory[]>(await authFetch('/store_requests/store-categories', session))
}

export async function getMyStoreRequest(session: Session): Promise<StoreRequest | null> {
  return unwrap<StoreRequest | null>(await authFetch('/store_requests/me', session))
}

export async function createStoreRequest(session: Session, body: CreateStoreRequestBody): Promise<StoreRequest> {
  return unwrap<StoreRequest>(
    await authFetch('/store_requests/create', session, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  )
}

export async function listStoreRequests(session: Session): Promise<StoreRequest[]> {
  return unwrap<StoreRequest[]>(await authFetch('/store_requests/', session))
}

export async function reviewStoreRequest(
  session: Session,
  id: string,
  decision: 'APROBADA' | 'RECHAZADA',
  reviewNote?: string
): Promise<StoreRequest> {
  return unwrap<StoreRequest>(
    await authFetch(`/store_requests/${id}/review`, session, {
      method: 'PATCH',
      body: JSON.stringify({ decision, reviewNote: reviewNote ?? null }),
    })
  )
}

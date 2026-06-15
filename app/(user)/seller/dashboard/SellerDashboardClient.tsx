'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KPI } from '@/components/ui'
import { deleteProduct } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Coupon, Product } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'

export default function SellerDashboardClient({
  products,
  coupons,
}: {
  products: Product[]
  coupons: Coupon[]
}) {
  const router = useRouter()
  const { session } = useAuth()
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [sellerProfileId, setSellerProfileId] = useState<string | null>(null)
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [selectedAuthIds, setSelectedAuthIds] = useState<string[]>([])
    const [authSubmitting, setAuthSubmitting] = useState(false)
    const [authError, setAuthError] = useState('')

const [sellerLoading, setSellerLoading] = useState(true)

function getUserIdFromToken(accessToken: string): string | null {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    return payload.userId ?? payload.uuid ?? payload.sub ?? null
  } catch {
    return null
  }
}

useEffect(() => {
  async function loadSellerProfile() {
    if (!session?.accessToken) {
      setSellerLoading(false)
      return
    }

    try {
      const userId = getUserIdFromToken(session.accessToken)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'}/seller_profiles/`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      )

      const json = await res.json()
      const profiles = json?.data ?? []

      const profile = profiles.find(
        (item: any) => item?.user?.uuid === userId
      )

      setSellerProfileId(profile?.id ?? null)
    } finally {
      setSellerLoading(false)
    }
  }

  loadSellerProfile()
}, [session])

async function sendToAuthentication() {
  if (!session?.accessToken) {
    setAuthError('Debes iniciar sesión para enviar productos a autenticación.')
    return
  }

  if (selectedAuthIds.length === 0) {
    setAuthError('Selecciona al menos un producto.')
    return
  }

  setAuthSubmitting(true)
  setAuthError('')

  try {
    await Promise.all(
      selectedAuthIds.map((productId) =>
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'}/products/patch/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            authStatus: 'PENDING',
          }),
        }).then(async (res) => {
          if (!res.ok) {
            const json = await res.json().catch(() => null)
            throw new Error(json?.message || json?.error || 'No se pudo enviar a autenticación.')
          }
        })
      )
    )

    setAuthModalOpen(false)
    setSelectedAuthIds([])
    router.refresh()
  } catch (err) {
    setAuthError(err instanceof Error ? err.message : 'No se pudo enviar a autenticación.')
  } finally {
    setAuthSubmitting(false)
  }
}



const myPieces = useMemo(() => {
  if (!sellerProfileId) return []
  return products.filter((p) => p.sellerId === sellerProfileId)
}, [products, sellerProfileId])

const activePieces = myPieces.filter((p) => !p.soldOut).length
const lowStockPieces = myPieces.filter((p) => p.lowStock > 0 && !p.soldOut).length

async function handleDelete() {
  if (!productToDelete) return

  if (!session?.accessToken) {
    setDeleteError('Debes iniciar sesión para eliminar productos.')
    return
  }

  setDeleting(true)
  setDeleteError('')

  try {
    await deleteProduct(productToDelete.id, session.accessToken)
    setProductToDelete(null)
    router.refresh()
  } catch (err) {
    setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.')
  } finally {
    setDeleting(false)
  }
}

if (sellerLoading) {
  return <div className="card" style={{ padding: 24 }}>Cargando tienda...</div>
}


  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
        <div>
          <div className="eyebrow accent">◇ VAULT.STD · MAYO 2026</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>PANEL DE TIENDA</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
                setSelectedAuthIds([])
                setAuthError('')
                setAuthModalOpen(true)
            }}
            >
            Enviar a autenticación
            </button>
        <Link href="/seller/products/new" className="btn">
        + Nueva pieza
        </Link>        
        </div>
      </div>

      <div className="kpi-grid">
        <KPI label="VENTAS DEL MES" value="$28,440" delta="+22.4%" />
        <KPI label="PEDIDOS" value="32" delta="+9" />
        <KPI label="PIEZAS ACTIVAS" value={String(activePieces)} />
        <KPI label="POCO STOCK" value={String(lowStockPieces).padStart(2, '0')} neg />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div className="display" style={{ fontSize: 20 }}>MIS PIEZAS</div>
            <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>VER TODAS →</button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Pieza</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {myPieces.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{p.name}</div>
                        <div className="mono mute">{p.brand}</div>
                      </div>
                    </div>
                  </td>

                  <td className="mono mute">{p.sku}</td>

                  <td>
                    <span className="display" style={{ fontSize: 13 }}>${p.price}</span>
                  </td>

                  <td>
                    {p.totalStock === 0
                      ? <span className="pill red">AGOTADO</span>
                      : p.lowStock > 0
                        ? <span className="pill yellow">BAJO · {p.totalStock}</span>
                        : <span className="pill green">EN STOCK · {p.totalStock}</span>}
                  </td>

                  <td>
                    {p.privateDrop && <span className="badge private">PRIVADO</span>}
                    {!p.privateDrop && p.limited && <span className="badge limited">LIMITADO</span>}
                    {!p.privateDrop && !p.limited && <span className="mono mute">PUBLICADO</span>}
                  </td>

                  <td>
                    <Link
                      href={`/seller/products/${p.id}/edit`}
                      className="mono accent"
                    >
                      EDITAR
                    </Link>

                    <button
                      type="button"
                      className="mono"
                      onClick={() => {
                        setProductToDelete(p)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        marginLeft: 12,
                      }}
                    >
                      ELIMINAR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ POR PREPARAR · 6 PENDIENTES</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>NUEVOS PEDIDOS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              ['KL-24218', 'Mario S.', 'Sombra Runner 01', 'US 9', '$240'],
              ['KL-24217', 'L. Hassan', 'Bóveda Alta Negra', 'US 10', '$410'],
              ['KL-24216', 'A. Cervantes', 'Lab Runner Volt', 'US 11', '$220'],
              ['KL-24215', 'K. Romero', 'Court Crema Baja', 'US 8.5', '$195'],
            ] as [string, string, string, string, string][]).map((o, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="display" style={{ fontSize: 13 }}>{o[0]}</span>
                  <span className="mono accent">{o[4]}</span>
                </div>
                <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>{o[2]} · {o[3]}</div>
                <div className="mono mute" style={{ marginTop: 2 }}>PARA {o[1].toUpperCase()}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn" style={{ padding: '6px 10px', fontSize: 11 }}>Marcar preparado</button>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>Imprimir guía</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ color: 'var(--danger)' }}>◆ ALERTAS DE STOCK</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>REPONER PRONTO</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myPieces
              .filter((p) => p.lowStock > 0 || p.soldOut)
              .map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 13 }}>{p.name}</div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span
                      className="mono"
                      style={{
                        color: p.soldOut
                          ? 'var(--danger)'
                          : 'var(--accent-2)',
                      }}
                    >
                      {p.soldOut ? 'AGOTADO' : `${p.totalStock} QUEDAN`}
                    </span>

                    <Link
                      href={`/seller/products/${p.id}/edit?mode=stock`}
                      className="btn btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Reponer
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow accent">◇ MIS PROMOCIONES</div>
          <div className="display" style={{ fontSize: 20, marginTop: 6, marginBottom: 16 }}>CUPONES ACTIVOS</div>

          {coupons.map((c) => (
            <div
              key={c.code}
              style={{
                padding: 12,
                border: '1px solid var(--border)',
                marginBottom: 8,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div>
                <div className="display" style={{ fontSize: 14 }}>{c.code}</div>
                <div className="mono mute" style={{ marginTop: 2 }}>{c.label}</div>
              </div>

              <div className="mono mute">{c.uses}/{c.max} usos</div>

              <span className={'pill ' + (c.active ? 'green' : 'gray')}>
                {c.active ? 'ACTIVO' : 'PAUSADO'}
              </span>

              <button className="mono accent" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                EDITAR
              </button>
            </div>
          ))}
        </div>
      </div>
      {productToDelete && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 24,
    }}
  >
    <div
      className="card"
      style={{
        width: '100%',
        maxWidth: 460,
        padding: 24,
        borderColor: 'var(--danger)',
      }}
    >
      <div className="eyebrow" style={{ color: 'var(--danger)' }}>
        ◆ ELIMINAR PRODUCTO
      </div>

      <div className="display" style={{ fontSize: 24, marginTop: 8 }}>
        ¿Eliminar esta pieza?
      </div>

      <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
        Se eliminará <strong>{productToDelete.name}</strong> junto con sus variantes e imágenes.
        Esta acción no se puede deshacer.
      </p>

      {deleteError && (
        <div
          className="card"
          style={{
            padding: 12,
            marginBottom: 16,
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {deleteError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setProductToDelete(null)
            setDeleteError('')
          }}
          disabled={deleting}
        >
          Cancelar
        </button>

        <button
          className="btn"
          onClick={handleDelete}
          disabled={deleting}
          style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
        </button>
      </div>
    </div>
  </div>
)}
{authModalOpen && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 24,
    }}
  >
    <div className="card" style={{ width: '100%', maxWidth: 560, padding: 24 }}>
      <div className="eyebrow accent">◇ AUTENTICACIÓN</div>

      <div className="display" style={{ fontSize: 24, marginTop: 8 }}>
        Enviar piezas a autenticación
      </div>

      <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
        Selecciona los productos que deseas enviar a revisión. Su estado cambiará a pendiente.
      </p>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {myPieces
          .filter((p) => p.auth === 'NOT_SUBMITTED' || p.auth === 'REJECTED')
          .map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAuthIds.includes(p.id)}
                onChange={(e) => {
                  setSelectedAuthIds((prev) =>
                    e.target.checked
                      ? [...prev, p.id]
                      : prev.filter((id) => id !== p.id)
                  )
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>
                  {p.name}
                </div>
                <div className="mono mute">{p.sku}</div>
              </div>

              <span className="mono mute">{p.auth}</span>
            </label>
          ))}
      </div>

      {myPieces.filter((p) => p.auth === 'NOT_SUBMITTED' || p.auth === 'REJECTED').length === 0 && (
        <div className="card" style={{ padding: 16, marginTop: 16 }}>
          No hay productos disponibles para enviar a autenticación.
        </div>
      )}

      {authError && (
        <div
          className="card"
          style={{
            padding: 12,
            marginTop: 16,
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
          }}
        >
          {authError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
        <button
          className="btn btn-ghost"
          disabled={authSubmitting}
          onClick={() => {
            setAuthModalOpen(false)
            setAuthError('')
          }}
        >
          Cancelar
        </button>

        <button
          className="btn"
          disabled={authSubmitting}
          onClick={sendToAuthentication}
        >
          {authSubmitting ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  </div>
)}

    </>
  )
}
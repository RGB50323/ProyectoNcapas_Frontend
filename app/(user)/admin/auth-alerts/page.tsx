'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import { Select } from '@/components/Select'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/lib/auth'
import { getProducts, patchProduct } from '@/lib/api'
import type { AuthStatus, Product } from '@/lib/types'

const AUTH_FILTERS = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'NOT_SUBMITTED', label: 'Sin enviar' },
  { value: 'AUTHENTICATED', label: 'Autenticados' },
  { value: 'REJECTED', label: 'Rechazados' },
  { value: '', label: 'Todos' },
]

const AUTH_LABELS: Record<AuthStatus, string> = {
  NOT_SUBMITTED: 'SIN ENVIAR',
  PENDING: 'PENDIENTE',
  AUTHENTICATED: 'AUTENTICADO',
  REJECTED: 'RECHAZADO',
}

function authPill(auth: AuthStatus) {
  if (auth === 'AUTHENTICATED') return 'pill green'
  if (auth === 'PENDING') return 'pill yellow'
  if (auth === 'REJECTED') return 'pill red'
  return 'pill'
}

function countByStatus(products: Product[], status: AuthStatus) {
  return products.filter((product) => product.auth === status).length
}

export default function AdminAuthAlertsPage() {
  const { session } = useAuth()
  const { show, ToastContainer } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<AuthStatus | ''>('PENDING')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<{ product: Product; authStatus: AuthStatus } | null>(null)

  async function loadProducts() {
    setLoading(true)
    try {
      setProducts(await getProducts())
    } catch {
      setProducts([])
      show('No se pudieron cargar las alertas de autenticación.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setAuthStatus(product: Product, authStatus: AuthStatus) {
    if (!session?.accessToken) return

    setUpdatingId(product.id)
    try {
      await patchProduct(product.id, { authStatus }, session.accessToken)
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, auth: authStatus } : item
        )
      )
      show(`${product.name} actualizado a ${AUTH_LABELS[authStatus]}.`, 'success')
    } catch (error) {
      show(error instanceof Error ? error.message : 'No se pudo actualizar la autenticación.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const shownProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return products
      .filter((product) => !statusFilter || product.auth === statusFilter)
      .filter((product) => {
        if (!q) return true
        return `${product.name} ${product.sku} ${product.brand}`.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (a.auth === 'PENDING' && b.auth !== 'PENDING') return -1
        if (a.auth !== 'PENDING' && b.auth === 'PENDING') return 1
        return a.name.localeCompare(b.name)
      })
  }, [products, query, statusFilter])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-2)' }}>◆ OPERACIONES</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>ALERTAS</h1>
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>
            {countByStatus(products, 'PENDING')} PENDIENTE{countByStatus(products, 'PENDING') === 1 ? '' : 'S'} DE REVISIÓN
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Buscar producto, SKU o marca..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ width: 280 }}
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as AuthStatus | '')}
            width={180}
            ariaLabel="Filtrar por estado de autenticación"
            options={AUTH_FILTERS}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        {(['PENDING', 'NOT_SUBMITTED', 'AUTHENTICATED', 'REJECTED'] as AuthStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            className="card"
            onClick={() => setStatusFilter(status)}
            style={{
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              borderColor: statusFilter === status ? 'var(--accent-2)' : 'var(--border)',
            }}
          >
            <div className="mono mute" style={{ fontSize: 11 }}>{AUTH_LABELS[status]}</div>
            <div className="display" style={{ fontSize: 28, marginTop: 8, color: 'var(--text)' }}>{countByStatus(products, status)}</div>
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Marca</th>
              <th>Estado</th>
              <th>Stock</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shownProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260 }}>
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      style={{ width: 42, height: 42, objectFit: 'cover', border: '1px solid var(--border)' }}
                    />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{product.name}</div>
                      <Link className="mono accent" style={{ fontSize: 11 }} href={`/admin/products/${product.id}/edit`}>
                        EDITAR FICHA
                      </Link>
                    </div>
                  </div>
                </td>
                <td><span className="mono mute">{product.sku}</span></td>
                <td><span className="mono mute">{product.brand}</span></td>
                <td><span className={authPill(product.auth)}>{AUTH_LABELS[product.auth]}</span></td>
                <td>
                  {product.soldOut
                    ? <span className="pill red">AGOTADO</span>
                    : product.lowStock > 0
                      ? <span className="pill yellow">BAJO · {product.totalStock}</span>
                      : <span className="pill green">{product.totalStock}</span>}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button
                    className="mono accent"
                    disabled={updatingId === product.id || product.auth === 'AUTHENTICATED'}
                    onClick={() => setPendingAction({ product, authStatus: 'AUTHENTICATED' })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: product.auth === 'AUTHENTICATED' ? 'not-allowed' : 'pointer',
                      opacity: product.auth === 'AUTHENTICATED' ? 0.45 : 1,
                      fontSize: 11,
                    }}
                  >
                    AUTENTICAR
                  </button>
                  <button
                    className="mono"
                    disabled={updatingId === product.id || product.auth === 'REJECTED'}
                    onClick={() => setPendingAction({ product, authStatus: 'REJECTED' })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: product.auth === 'REJECTED' ? 'var(--text-mute)' : 'var(--danger)',
                      cursor: product.auth === 'REJECTED' ? 'not-allowed' : 'pointer',
                      opacity: product.auth === 'REJECTED' ? 0.45 : 1,
                      marginLeft: 16,
                      fontSize: 11,
                    }}
                  >
                    RECHAZAR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && shownProducts.length === 0 && (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>Sin productos para este filtro.</div>
        )}
        {loading && (
          <div className="mono mute" style={{ padding: 32, textAlign: 'center', fontSize: 13 }}>Cargando alertas...</div>
        )}
      </div>

      <Modal
        open={pendingAction !== null}
        title={pendingAction?.authStatus === 'AUTHENTICATED' ? 'Autenticar producto' : 'Rechazar producto'}
        onClose={() => setPendingAction(null)}
        width={440}
      >
        <p className="mute" style={{ fontSize: 13, marginBottom: 20 }}>
          {pendingAction?.authStatus === 'AUTHENTICATED'
            ? '¿Estás seguro que deseas autenticar este producto?'
            : '¿Estás seguro que deseas rechazar este producto?'}
          {pendingAction && (
            <strong style={{ color: 'var(--text)', display: 'block', marginTop: 10 }}>
              {pendingAction.product.name}
            </strong>
          )}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setPendingAction(null)}
            disabled={updatingId !== null}
          >
            Cancelar
          </button>
          <button
            className="btn"
            style={pendingAction?.authStatus === 'REJECTED' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}
            disabled={updatingId !== null || !pendingAction}
            onClick={async () => {
              if (!pendingAction) return
              const action = pendingAction
              await setAuthStatus(action.product, action.authStatus)
              setPendingAction(null)
            }}
          >
            {pendingAction?.authStatus === 'AUTHENTICATED' ? 'Autenticar' : 'Rechazar'}
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  )
}

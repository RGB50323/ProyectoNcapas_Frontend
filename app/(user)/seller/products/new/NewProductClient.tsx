'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandOption, Category } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { createProduct, createProductImage, createProductVariant, uploadProductImage } from '@/lib/api'
import { Select } from '@/components/Select'
import ImageDropzone from '@/components/ImageDropzone'
import NumberField from '@/components/NumberField'
import { useToast } from '@/hooks/useToast'
import { PageLoader } from '@/components/PageLoader'

const MAX_IMAGE_MB = 5

const CONDITIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'LIKE_NEW', label: 'Como nuevo' },
  { value: 'USED', label: 'Usado' },
  { value: 'REFURBISHED', label: 'Reacondicionado' },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

type NewVariant = {
  size: string
  color: string
  colorHex: string
  stock: number
  priceDelta: number
}

type NewImage = {
  url: string
  altText: string
  primaryImage: boolean
  sortOrder: number
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function getUserIdFromToken(accessToken: string): string | null {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))

    return (
      payload.sellerId ??
      payload.sellerProfileId ??
      payload.userId ??
      payload.sub ??
      null
    )
  } catch {
    return null
  }
}

async function getSellerProfileIdByUserId(
  token: string,
  userId: string
): Promise<string | null> {
  const res = await fetch(`${API_BASE_URL}/seller_profiles/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(json?.message || json?.error || 'No se pudo obtener el perfil de seller.')
  }

  const profiles = json?.data ?? []

  const profile = profiles.find(
    (item: any) => item?.user?.uuid === userId
  )

  return profile?.id ?? null
}

export default function NewProductClient({
  categories,
  brandOptions,
}: {
  categories: Category[]
  brandOptions: BrandOption[]
}) {
  const router = useRouter()
  const { session, loading } = useAuth()

  const { show, ToastContainer } = useToast()

  const [status, setStatus] = useState<SaveStatus>('idle')

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: '',
    description: '',
    categoryId: categories[0]?.id ?? '',
    brandId: brandOptions[0]?.id ?? '',
    condition: 'NEW',
    conditionScore: '5.0',
  })

  const [variants, setVariants] = useState<NewVariant[]>([
    {
      size: '',
      color: '',
      colorHex: '#000000',
      stock: 1,
      priceDelta: 0,
    },
  ])

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')

  const [images, setImages] = useState<NewImage[]>([
    {
      url: '',
      altText: '',
      primaryImage: true,
      sortOrder: 1,
    },
  ])

  if (loading) return <PageLoader />

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateVariant(index: number, field: keyof NewVariant, value: string | number) {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    )
  }

  function addVariant() {
    setVariants((prev) => [
      ...prev,
      {
        size: '',
        color: '',
        colorHex: '#000000',
        stock: 1,
        priceDelta: 0,
      },
    ])
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateImage(index: number, field: keyof NewImage, value: string | number | boolean) {
    setImages((prev) =>
      prev.map((image, i) =>
        i === index ? { ...image, [field]: value } : image
      )
    )
  }

  function addImage() {
    setImages((prev) => [
      ...prev,
      {
        url: '',
        altText: form.name,
        primaryImage: prev.length === 0,
        sortOrder: prev.length + 1,
      },
    ])
  }

  async function handleFile(index: number, file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Solo se permiten imágenes.'); return }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setUploadError(`La imagen supera ${MAX_IMAGE_MB} MB.`); return }
    if (!session?.accessToken) { setUploadError('Inicia sesión para subir imágenes.'); return }
    setUploadError('')
    setUploadingIndex(index)
    try {
      const url = await uploadProductImage(file, session.accessToken)
      updateImage(index, 'url', url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'No se pudo subir la imagen.')
    } finally {
      setUploadingIndex(null)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function markPrimaryImage(index: number) {
    setImages((prev) =>
      prev.map((image, i) => ({
        ...image,
        primaryImage: i === index,
      }))
    )
  }

  async function handleSave() {
    if (!session?.accessToken) {
      show('Debes iniciar sesión como SELLER o ADMIN para crear productos.', 'error')
      return
    }

    const userId = getUserIdFromToken(session.accessToken)

    if (!userId) {
      show('No se pudo obtener el userId desde la sesión.', 'error')
      return
    }

    if (!form.name.trim() || !form.price || !form.categoryId || !form.brandId) {
      show('Completa nombre, precio, categoría y marca.', 'error')
      return
    }

    const sellerId = await getSellerProfileIdByUserId(
    session.accessToken,
    userId
    )

    if (!sellerId) {
    show('No se encontró un perfil de seller asociado a este usuario.', 'error')
    return
    }

    const validVariants = variants.filter(
      (variant) => variant.size.trim() && variant.color.trim()
    )

    const validImages = images.filter(
      (image) => image.url.trim()
    )

    if (validVariants.length === 0) {
      show('Agrega al menos una variante válida.', 'error')
      return
    }

    if (validImages.length === 0) {
      show('Agrega al menos una imagen válida.', 'error')
      return
    }

    setStatus('saving')

    try {
      const totalStock = validVariants.reduce(
        (sum, variant) => sum + Number(variant.stock),
        0
      )

      const sku =
        form.sku.trim() ||
        `PRD-${Date.now()}`

      const product = await createProduct(
        {
          sellerId,
          categoryId: form.categoryId,
          brandId: form.brandId,
          sku,
          name: form.name,
          slug: `${slugify(form.name)}-${Date.now()}`,
          description: form.description,
          price: Number(form.price),
          condition: form.condition,
          conditionScore: Number(form.conditionScore),
          authStatus: 'NOT_SUBMITTED',
          totalStock,
        },
        session.accessToken
      )

      const productId = product?.id

      if (!productId) {
        throw new Error('El backend no devolvió el ID del producto creado.')
      }

      await Promise.all(
        validVariants.map((variant) =>
          createProductVariant(
            {
              productId,
              size: variant.size,
              colorName: variant.color,
              colorHex: variant.colorHex,
              stock: Number(variant.stock),
              priceDelta: Number(variant.priceDelta),
            },
            session.accessToken
          )
        )
      )

      await Promise.all(
        validImages.map((image, index) =>
          createProductImage(
            {
              productId,
              url: image.url,
              altText: image.altText || form.name,
              primaryImage: image.primaryImage,
              sortOrder: Number(image.sortOrder || index + 1),
            },
            session.accessToken
          )
        )
      )

      setStatus('success')
      show('Pieza creada', 'success')

      setTimeout(() => {
        router.push('/seller/dashboard')
        router.refresh()
      }, 900)
    } catch (err) {
      setStatus('idle')
      show(err instanceof Error ? err.message : 'No se pudo crear la pieza.', 'error')
    }
  }

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
        <div>
          <div className="eyebrow accent">◇ NUEVA PIEZA</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>
            Crear producto
          </h1>
        </div>

        <button className="btn btn-ghost" onClick={() => router.push('/seller/dashboard')}>
          Volver al panel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        <div style={{ display: 'grid', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 20 }}>
              Información del producto
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <label>
                <div className="label">Nombre</div>
                <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </label>

              <label>
                <div className="label">SKU</div>
                <input className="input" value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="Opcional: se genera automático" />
              </label>

              <label>
                <div className="label">Precio</div>
                <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value.replace(/^0+(?=\d)/, ''))} />
              </label>

              <label>
                <div className="label">Descripción</div>
                <textarea className="input" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} />
              </label>

              <div>
                <div className="label">Categoría</div>
                <Select value={form.categoryId} onChange={(v) => update('categoryId', v)} width="100%" ariaLabel="Categoría" placeholder="Selecciona categoría" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </div>

              <div>
                <div className="label">Marca</div>
                <Select value={form.brandId} onChange={(v) => update('brandId', v)} width="100%" ariaLabel="Marca" placeholder="Selecciona marca" options={brandOptions.map((b) => ({ value: b.id, label: b.name }))} />
              </div>

              <div>
                <div className="label">Condición</div>
                <Select value={form.condition} onChange={(v) => update('condition', v)} width="100%" ariaLabel="Condición" options={CONDITIONS} />
              </div>

              <label>
                <div className="label">Condition score</div>
                <input className="input" type="number" min={0} max={5} step="0.1" value={form.conditionScore} onChange={(e) => update('conditionScore', e.target.value.replace(/^0+(?=\d)/, ''))} />
              </label>

            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="display" style={{ fontSize: 20 }}>Variantes iniciales</div>
              <button className="btn btn-ghost" onClick={addVariant}>+ Agregar variante</button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {variants.map((variant, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto',
                    gap: 10,
                    alignItems: 'end',
                    border: '1px solid var(--border)',
                    padding: 12,
                  }}
                >
                  <label>
                    <div className="label">Talla</div>
                    <input className="input" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                  </label>

                  <label>
                    <div className="label">Color</div>
                    <input className="input" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                  </label>

                  <label>
                    <div className="label">Stock</div>
                    <NumberField min={0} value={variant.stock} onChange={(n) => updateVariant(index, 'stock', n)} />
                  </label>

                  <label>
                    <div className="label">Price delta</div>
                    <NumberField float step="0.01" value={variant.priceDelta} onChange={(n) => updateVariant(index, 'priceDelta', n)} />
                  </label>

                  <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeVariant(index)}>
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="display" style={{ fontSize: 20 }}>Imágenes iniciales</div>
              <button className="btn btn-ghost" onClick={addImage}>+ Agregar imagen</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '170px 1fr',
                    gap: 16,
                    border: '1px solid var(--border)',
                    padding: 12,
                  }}
                >
                  <ImageDropzone
                    value={image.url}
                    uploading={uploadingIndex === index}
                    alt={image.altText || form.name}
                    maxMb={MAX_IMAGE_MB}
                    onFile={(f) => handleFile(index, f)}
                  />

                  <div style={{ display: 'grid', gap: 10 }}>
                    <label>
                      <div className="label">Texto alternativo</div>
                      <input className="input" value={image.altText} onChange={(e) => updateImage(index, 'altText', e.target.value)} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <label>
                        <div className="label">Orden</div>
                        <NumberField min={0} value={image.sortOrder} onChange={(n) => updateImage(index, 'sortOrder', n)} />
                      </label>

                      <button className={image.primaryImage ? 'btn' : 'btn btn-ghost'} onClick={() => markPrimaryImage(index)}>
                        {image.primaryImage ? 'Principal' : 'Marcar principal'}
                      </button>

                      <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeImage(index)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {uploadError && <div className="mono" style={{ color: 'var(--danger)', fontSize: 12 }}>{uploadError}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => router.push('/seller/dashboard')} disabled={status === 'saving'}>
              Cancelar
            </button>

            <button className="btn" onClick={handleSave} disabled={status === 'saving'} style={{ minWidth: 180 }}>
              {status === 'saving' ? 'Creando...' : 'Crear pieza'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
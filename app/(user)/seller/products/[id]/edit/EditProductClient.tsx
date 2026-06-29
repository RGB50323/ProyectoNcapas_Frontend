'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BrandOption, Category, Product, ProductImage, Variant } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import {
  createProductImage,
  createProductVariant,
  deleteProductImage,
  deleteProductVariant,
  patchProduct,
  patchProductImage,
  patchProductVariant,
  uploadProductImage,
} from '@/lib/api'
import { Select } from '@/components/Select'
import ImageDropzone from '@/components/ImageDropzone'
import ColorPicker from '@/components/ColorPicker'
import NumberField from '@/components/NumberField'
import { useToast } from '@/hooks/useToast'

const MAX_IMAGE_MB = 5
const CONDITIONS = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'LIKE_NEW', label: 'Como nuevo' },
  { value: 'USED', label: 'Usado' },
  { value: 'REFURBISHED', label: 'Reacondicionado' },
]

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}




export default function EditProductClient({
  product,
  categories,
  brandOptions,
  mode,
}: {
  product: Product
  categories: Category[]
  brandOptions: BrandOption[]
  mode?: string
}) {
  const router = useRouter()
  const { session } = useAuth()
  const isStockMode = mode === 'stock'

  const { show, ToastContainer } = useToast()

  const [status, setStatus] = useState<SaveStatus>('idle')

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    description: product.desc,
    categoryId: product.categoryId ?? product.category,
    brandId: product.brandId ?? '',
    condition: product.condition,
    imageUrl: product.images[0] ?? '',
  })

  const [variants, setVariants] = useState<Variant[]>(
    product.variants.map((variant) => ({ ...variant }))
  )

  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')

  const [images, setImages] = useState<ProductImage[]>(
  (product.productImages ?? []).map((image) => ({ ...image }))
)

const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

    function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) =>
        prev.map((variant, i) =>
        i === index
            ? {
                ...variant,
                [field]: value,
            }
            : variant
        )
    )
    }

        function addVariant() {
    setVariants((prev) => [
        ...prev,
        {
        id: `new-${Date.now()}`,
        productId: product.id,
        size: '',
        color: '',
        colorHex: '#000000',
        stock: 0,
        priceDelta: 0,
        },
    ])
    }

    function removeVariant(index: number) {
    const target = variants[index]

    if (target?.id && !target.id.startsWith('new-')) {
        setDeletedVariantIds((ids) =>
        ids.includes(target.id!)
            ? ids
            : [...ids, target.id!]
        )
    }

    setVariants((prev) => prev.filter((_, i) => i !== index))
    }

  function updateImage(index: number, field: keyof ProductImage, value: string | number | boolean) {
  setImages((prev) =>
    prev.map((image, i) =>
      i === index
        ? {
            ...image,
            [field]: value,
          }
        : image
    )
  )
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

function addImage() {
  setImages((prev) => [
    ...prev,
    {
      id: `new-${Date.now()}`,
      productId: product.id,
      url: '',
      altText: product.name,
      primaryImage: prev.length === 0,
      sortOrder: prev.length + 1,
    },
  ])
}

function removeImage(index: number) {
  const target = images[index]

  if (target && !target.id.startsWith('new-')) {
    setDeletedImageIds((ids) =>
      ids.includes(target.id)
        ? ids
        : [...ids, target.id]
    )
  }

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
    show('Debes iniciar sesión como SELLER o ADMIN para editar.', 'error')
    return
  }

  const validVariants = variants.filter((variant) => variant.size.trim() && variant.color.trim())
  const validImages = images.filter((image) => image.url.trim())

  if (validVariants.length === 0) {
    show('Agrega al menos una variante válida.', 'error')
    return
  }

  if (!isStockMode && validImages.length === 0) {
    show('Agrega al menos una imagen válida.', 'error')
    return
  }

  setStatus('saving')

  try {
    if (!isStockMode) {
      await patchProduct(
        product.id,
        {
          categoryId: form.categoryId,
          brandId: form.brandId,
          sku: form.sku,
          name: form.name,
          slug: `${slugify(form.name)}-${Date.now()}`,
          description: form.description,
          price: Number(form.price),
          condition: form.condition,
        },
        session.accessToken
      )

      await Promise.all(
        Array.from(new Set(deletedImageIds)).map((imageId) =>
          deleteProductImage(imageId, session.accessToken)
        )
      )

      await Promise.all(
        validImages
          .map((image, index) => {
            const body = {
              productId: product.id,
              url: image.url,
              altText: image.altText || form.name,
              primaryImage: image.primaryImage,
              sortOrder: Number(image.sortOrder || index + 1),
            }

            if (image.id.startsWith('new-')) {
              return createProductImage(body, session.accessToken)
            }

            return patchProductImage(image.id, body, session.accessToken)
          })
      )
    }

await Promise.all(
  Array.from(new Set(deletedVariantIds)).map((variantId) =>
    deleteProductVariant(variantId, session.accessToken)
  )
)

await Promise.all(
  validVariants
    .map((variant) => {
      const body = {
        productId: product.id,
        size: variant.size,
        colorName: variant.color,
        colorHex: variant.colorHex,
        stock: Number(variant.stock),
        priceDelta: Number(variant.priceDelta),
      }

      if (variant.id?.startsWith('new-')) {
        return createProductVariant(body, session.accessToken)
      }

      return patchProductVariant(variant.id!, body, session.accessToken)
    })
)

    setStatus('success')
    show('Cambios guardados', 'success')

    setTimeout(() => {
      router.push('/seller/dashboard')
      router.refresh()
    }, 900)
  } catch (err) {
    setStatus('idle')
    show(err instanceof Error ? err.message : 'No se pudo guardar.', 'error')
  }
}

return (
  <div>
    <ToastContainer />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24 }}>
      <div>
        <div className="eyebrow accent">
          ◇ {isStockMode ? 'REPONER STOCK' : 'EDITAR PIEZA'}
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 7vw, 40px)', marginTop: 8 }}>
          {product.name}
        </h1>
      </div>

      <button className="btn btn-ghost" onClick={() => router.push('/seller/dashboard')}>
        Volver al panel
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: isStockMode ? '1fr' : '1.2fr 0.8fr', gap: 24 }}>
      {!isStockMode && (
<div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>          
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
                <input className="input" value={form.sku} onChange={(e) => update('sku', e.target.value)} />
              </label>

              <label>
                <div className="label">Precio</div>
                <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value.replace(/^0+(?=\d)/, ''))} />
              </label>

              <label>
                <div className="label">Descripción</div>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={4}
                />
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
                <Select value={form.condition} onChange={(v) => update('condition', v as typeof form.condition)} width="100%" ariaLabel="Condición" options={CONDITIONS} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
  <div className="display" style={{ fontSize: 20 }}>
    Variantes
  </div>

  <button className="btn btn-ghost" onClick={addVariant}>
    + Agregar variante
  </button>
</div>


            {variants.length === 0 && (
              <p className="mono mute">
                Este producto no tiene variantes asociadas.
              </p>
            )}

            {variants.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {variants.map((variant, index) => (
                  <div
                    key={variant.id ?? `${variant.size}-${variant.color}`}
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
                      <input
                        className="input"
                        value={variant.size}
                        onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      />
                    </label>

                    <label>
                      <div className="label">Color</div>
                      <input
                        className="input"
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      />
                    </label>

                    <label>
                      <div className="label">HEX</div>
                      <div className="hexfield">
                        <ColorPicker value={variant.colorHex} onChange={(hex) => updateVariant(index, 'colorHex', hex)} />
                        <input
                          className="input"
                          value={variant.colorHex}
                          onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                        />
                      </div>
                    </label>

                    <label>
                      <div className="label">Stock</div>
                      <NumberField min={0} value={variant.stock} onChange={(n) => updateVariant(index, 'stock', n)} />
                    </label>

                    <label>
                      <div className="label">Price delta</div>
                      <NumberField float step="0.01" value={variant.priceDelta} onChange={(n) => updateVariant(index, 'priceDelta', n)} />
                    </label>
                    <button
                    className="btn btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeVariant(index)}
                    >
                    Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
        {!isStockMode && (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="display" style={{ fontSize: 20 }}>
                Imágenes del producto
              </div>

              <button className="btn btn-ghost" onClick={addImage}>
                + Agregar imagen
              </button>
            </div>

            {images.length === 0 && (
              <p className="mono mute">
                Este producto no tiene imágenes asociadas.
              </p>
            )}

            <div style={{ display: 'grid', gap: 14 }}>
              {images.map((image, index) => (
                <div
                  key={image.id}
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
                      <input
                        className="input"
                        value={image.altText ?? ''}
                        onChange={(e) => updateImage(index, 'altText', e.target.value)}
                      />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <label>
                        <div className="label">Orden</div>
                        <NumberField
                          min={0}
                          value={image.sortOrder}
                          onChange={(n) => updateImage(index, 'sortOrder', n)}
                        />
                      </label>

                      <button
                        className={image.primaryImage ? 'btn' : 'btn btn-ghost'}
                        onClick={() => markPrimaryImage(index)}
                      >
                        {image.primaryImage ? 'Principal' : 'Marcar principal'}
                      </button>

                      <button
                        className="btn btn-ghost"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => removeImage(index)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {uploadError && <div className="mono" style={{ color: 'var(--danger)', fontSize: 12 }}>{uploadError}</div>}
            </div>
          </div>
        )}

        {!isStockMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => router.push('/seller/dashboard')} disabled={status === 'saving'}>Cancelar</button>
            <button className="btn" onClick={handleSave} disabled={status === 'saving'} style={{ minWidth: 180 }}>
              {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}

        {isStockMode && (
          <div className="card" style={{ padding: 24 }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 20 }}>
              Reponer variantes
            </div>

            {variants.length === 0 && (
              <p className="mono mute">
                Este producto no tiene variantes asociadas.
              </p>
            )}

            {variants.length > 0 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {variants.map((variant, index) => (
                  <div
                    key={variant.id ?? `${variant.size}-${variant.color}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr',
                      gap: 10,
                      alignItems: 'end',
                      border: '1px solid var(--border)',
                      padding: 12,
                    }}
                  >
                    <div>
                      <div className="label">Variante</div>
                      <div className="display" style={{ fontSize: 14 }}>
                        {variant.size} · {variant.color}
                      </div>
                      <div className="mono mute">{variant.colorHex}</div>
                    </div>

                    <label>
                      <div className="label">Stock</div>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isStockMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => router.push('/seller/dashboard')} disabled={status === 'saving'}>Cancelar</button>
            <button className="btn" onClick={handleSave} disabled={status === 'saving'} style={{ minWidth: 180 }}>
              {status === 'saving' ? 'Guardando...' : 'Guardar stock'}
            </button>
          </div>
        )}
      </div>
    </div>

  </div>
)
}
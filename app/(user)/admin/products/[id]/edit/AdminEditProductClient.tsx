'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthStatus, BrandOption, Category, Condition, Product, ProductImage, Variant } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { admin, type AdminSeller } from '@/lib/admin'
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

const AUTH_OPTIONS = [
  { value: 'NOT_SUBMITTED', label: 'Sin enviar' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'AUTHENTICATED', label: 'Autenticado' },
  { value: 'REJECTED', label: 'Rechazado' },
]

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

export default function AdminEditProductClient({
  product,
  categories,
  brandOptions,
}: {
  product: Product
  categories: Category[]
  brandOptions: BrandOption[]
}) {
  const router = useRouter()
  const { session } = useAuth()

  const { show, ToastContainer } = useToast()

  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [status, setStatus] = useState<SaveStatus>('idle')

  const [form, setForm] = useState({
    sellerId: product.sellerId ?? '',
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    description: product.desc,
    categoryId: product.categoryId ?? product.category,
    brandId: product.brandId ?? '',
    condition: product.condition,
    authStatus: product.auth,
    featured: product.featured,
    newProduct: product.isNew,
    limited: product.limited,
    privateDrop: product.privateDrop,
  })

  const [variants, setVariants] = useState<Variant[]>(
    product.variants.map((variant) => ({ ...variant }))
  )
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([])

  const [images, setImages] = useState<ProductImage[]>(
    (product.productImages ?? []).map((image) => ({ ...image }))
  )
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (!session) return
    admin.listSellers(session).then(setSellers).catch(() => setSellers([]))
  }, [session])

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
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
      setDeletedVariantIds((ids) => ids.includes(target.id!) ? ids : [...ids, target.id!])
    }

    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateImage(index: number, field: keyof ProductImage, value: string | number | boolean) {
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
        id: `new-${Date.now()}`,
        productId: product.id,
        url: '',
        altText: form.name,
        primaryImage: prev.length === 0,
        sortOrder: prev.length + 1,
      },
    ])
  }

  function removeImage(index: number) {
    const target = images[index]

    if (target && !target.id.startsWith('new-')) {
      setDeletedImageIds((ids) => ids.includes(target.id) ? ids : [...ids, target.id])
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

  async function handleFile(index: number, file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Solo se permiten imagenes.'); return }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setUploadError(`La imagen supera ${MAX_IMAGE_MB} MB.`); return }
    if (!session?.accessToken) { setUploadError('Inicia sesion para subir imagenes.'); return }

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

  async function handleSave() {
    if (!session?.accessToken) {
      show('Debes iniciar sesion como ADMIN para editar productos.', 'error')
      return
    }

    if (!form.sellerId || !form.name.trim() || !form.price || !form.categoryId || !form.brandId) {
      show('Completa tienda, nombre, precio, categoria y marca.', 'error')
      return
    }

    setStatus('saving')

    try {
      await patchProduct(
        product.id,
        {
          sellerId: form.sellerId,
          categoryId: form.categoryId,
          brandId: form.brandId,
          sku: form.sku,
          name: form.name,
          slug: `${slugify(form.name)}-${Date.now()}`,
          description: form.description,
          price: Number(form.price),
          condition: form.condition,
          authStatus: form.authStatus,
          featured: form.featured,
          newProduct: form.newProduct,
          limited: form.limited,
          privateDrop: form.privateDrop,
        },
        session.accessToken
      )

      await Promise.all(
        Array.from(new Set(deletedImageIds)).map((imageId) =>
          deleteProductImage(imageId, session.accessToken)
        )
      )

      await Promise.all(
        images
          .filter((image) => image.url.trim().length > 0)
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

      await Promise.all(
        Array.from(new Set(deletedVariantIds)).map((variantId) =>
          deleteProductVariant(variantId, session.accessToken)
        )
      )

      await Promise.all(
        variants
          .filter((variant) => variant.size.trim().length > 0)
          .filter((variant) => variant.color.trim().length > 0)
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
        router.push('/admin/products')
        router.refresh()
      }, 900)
    } catch (err) {
      setStatus('idle')
      show(err instanceof Error ? err.message : 'No se pudo guardar el producto.', 'error')
    }
  }

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow accent">◆ ADMIN PRODUCTOS</div>
          <h1 className="display" style={{ fontSize: 40, marginTop: 8 }}>{product.name}</h1>
          <div className="mono mute" style={{ marginTop: 8, fontSize: 12 }}>SKU {product.sku}</div>
        </div>

        <button className="btn btn-ghost" onClick={() => router.push('/admin/products')}>
          Volver a productos
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card" style={{ padding: 24 }}>
            <div className="display" style={{ fontSize: 20, marginBottom: 20 }}>Informacion del producto</div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <div className="label">Tienda</div>
                <Select value={form.sellerId} onChange={(v) => update('sellerId', v)} width="100%" ariaLabel="Tienda" placeholder="Selecciona tienda" options={sellers.map((s) => ({ value: s.id, label: s.storeName }))} />
              </div>

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
                <div className="label">Descripcion</div>
                <textarea className="input" value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} />
              </label>

              <div>
                <div className="label">Categoria</div>
                <Select value={form.categoryId} onChange={(v) => update('categoryId', v)} width="100%" ariaLabel="Categoria" placeholder="Selecciona categoria" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </div>

              <div>
                <div className="label">Marca</div>
                <Select value={form.brandId} onChange={(v) => update('brandId', v)} width="100%" ariaLabel="Marca" placeholder="Selecciona marca" options={brandOptions.map((b) => ({ value: b.id, label: b.name }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label">Condicion</div>
                  <Select value={form.condition} onChange={(v) => update('condition', v as Condition)} width="100%" ariaLabel="Condicion" options={CONDITIONS} />
                </div>
                <div>
                  <div className="label">Autenticacion</div>
                  <Select value={form.authStatus} onChange={(v) => update('authStatus', v as AuthStatus)} width="100%" ariaLabel="Autenticacion" options={AUTH_OPTIONS} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <label className="mono"><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} /> Destacado</label>
                <label className="mono"><input type="checkbox" checked={form.newProduct} onChange={(e) => update('newProduct', e.target.checked)} /> Nuevo</label>
                <label className="mono"><input type="checkbox" checked={form.limited} onChange={(e) => update('limited', e.target.checked)} /> Limitado</label>
                <label className="mono"><input type="checkbox" checked={form.privateDrop} onChange={(e) => update('privateDrop', e.target.checked)} /> Drop privado</label>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="display" style={{ fontSize: 20 }}>Variantes</div>
              <button className="btn btn-ghost" onClick={addVariant}>+ Agregar variante</button>
            </div>

            {variants.length === 0 && <p className="mono mute">Este producto no tiene variantes asociadas.</p>}

            <div style={{ display: 'grid', gap: 12 }}>
              {variants.map((variant, index) => (
                <div key={variant.id ?? `${variant.size}-${variant.color}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end', border: '1px solid var(--border)', padding: 12 }}>
                  <label>
                    <div className="label">Talla</div>
                    <input className="input" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                  </label>
                  <label>
                    <div className="label">Color</div>
                    <input className="input" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                  </label>
                  <label>
                    <div className="label">HEX</div>
                    <div className="hexfield">
                      <ColorPicker value={variant.colorHex} onChange={(hex) => updateVariant(index, 'colorHex', hex)} />
                      <input className="input" value={variant.colorHex} onChange={(e) => updateVariant(index, 'colorHex', e.target.value)} />
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
                  <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeVariant(index)}>Eliminar</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="display" style={{ fontSize: 20 }}>Imagenes del producto</div>
              <button className="btn btn-ghost" onClick={addImage}>+ Agregar imagen</button>
            </div>

            {images.length === 0 && <p className="mono mute">Este producto no tiene imagenes asociadas.</p>}

            <div style={{ display: 'grid', gap: 14 }}>
              {images.map((image, index) => (
                <div key={image.id} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 16, border: '1px solid var(--border)', padding: 12 }}>
                  <ImageDropzone value={image.url} uploading={uploadingIndex === index} alt={image.altText || form.name} maxMb={MAX_IMAGE_MB} onFile={(f) => handleFile(index, f)} />

                  <div style={{ display: 'grid', gap: 10 }}>
                    <label>
                      <div className="label">Texto alternativo</div>
                      <input className="input" value={image.altText ?? ''} onChange={(e) => updateImage(index, 'altText', e.target.value)} />
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                      <label>
                        <div className="label">Orden</div>
                        <NumberField min={0} value={image.sortOrder} onChange={(n) => updateImage(index, 'sortOrder', n)} />
                      </label>
                      <button className={image.primaryImage ? 'btn' : 'btn btn-ghost'} onClick={() => markPrimaryImage(index)}>
                        {image.primaryImage ? 'Principal' : 'Marcar principal'}
                      </button>
                      <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeImage(index)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
              {uploadError && <div className="mono" style={{ color: 'var(--danger)', fontSize: 12 }}>{uploadError}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => router.push('/admin/products')} disabled={status === 'saving'}>Cancelar</button>
            <button className="btn" onClick={handleSave} disabled={status === 'saving'} style={{ minWidth: 180 }}>
              {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

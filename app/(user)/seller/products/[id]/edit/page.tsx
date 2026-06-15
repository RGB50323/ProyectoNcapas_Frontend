import { notFound } from 'next/navigation'
import { getBrandOptions, getCategories, getProduct } from '@/lib/api'
import EditProductClient from './EditProductClient'

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const { id } = await params
  const { mode } = await searchParams

  const [product, categories, brandOptions] = await Promise.all([
    getProduct(id),
    getCategories(),
    getBrandOptions(),
  ])

  if (!product) notFound()

  return (
    <EditProductClient
      product={product}
      categories={categories}
      brandOptions={brandOptions}
      mode={mode}
    />
  )
}
import { notFound } from 'next/navigation'
import { getBrandOptions, getCategories, getProduct } from '@/lib/api'
import AdminEditProductClient from './AdminEditProductClient'

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, categories, brandOptions] = await Promise.all([
    getProduct(id),
    getCategories(),
    getBrandOptions(),
  ])

  if (!product) notFound()

  return (
    <AdminEditProductClient
      product={product}
      categories={categories}
      brandOptions={brandOptions}
    />
  )
}

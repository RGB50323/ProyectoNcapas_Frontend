import { notFound } from 'next/navigation'
import { getPublicProduct, getPublicProducts, getReviews } from '@/lib/api'
import PDPClient from './PDPClient'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getPublicProduct(id)
  if (!product) notFound()

  const [reviews, all] = await Promise.all([getReviews(id), getPublicProducts()])
  const similar = all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  return <PDPClient product={product} reviews={reviews} similar={similar} />
}

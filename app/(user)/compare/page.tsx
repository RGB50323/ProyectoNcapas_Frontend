import { getPublicProducts, getCategories } from '@/lib/api'
import CompareClient from './CompareClient'

export default async function ComparePage() {
  const [products, categories] = await Promise.all([getPublicProducts(), getCategories()])

  return <CompareClient allProducts={products} categories={categories} />
}
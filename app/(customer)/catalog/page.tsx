import { getProducts, getCategories, getBrands } from '@/lib/api'
import CatalogClient from './CatalogClient'

export default async function CatalogPage() {
  const [products, categories, brands] = await Promise.all([
    getProducts(), getCategories(), getBrands(),
  ])
  return <CatalogClient products={products} categories={categories} brands={brands} />
}

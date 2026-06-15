import { getBrandOptions, getCategories } from '@/lib/api'
import NewProductClient from './NewProductClient'

export default async function NewProductPage() {
  const [categories, brandOptions] = await Promise.all([
    getCategories(),
    getBrandOptions(),
  ])

  return (
    <NewProductClient
      categories={categories}
      brandOptions={brandOptions}
    />
  )
}
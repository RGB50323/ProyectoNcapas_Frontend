import { getBrandOptions, getCategories } from '@/lib/api'
import AdminNewProductClient from './AdminNewProductClient'

export default async function AdminNewProductPage() {
  const [categories, brandOptions] = await Promise.all([
    getCategories(),
    getBrandOptions(),
  ])

  return (
    <AdminNewProductClient
      categories={categories}
      brandOptions={brandOptions}
    />
  )
}

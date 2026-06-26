'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getBrandOptions, getCategories, getProduct } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageLoader } from '@/components/PageLoader'
import type { BrandOption, Category, Product } from '@/lib/types'
import AdminEditProductClient from './AdminEditProductClient'

export default function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { session, loading } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (loading || !session || !id) return
    let active = true
    setLoadingData(true)

    Promise.all([
      getProduct(id, session),
      getCategories(),
      getBrandOptions(),
    ])
      .then(([productData, categoriesData, brandOptionsData]) => {
        if (!active) return
        if (!productData) {
          router.replace('/admin/products')
          return
        }
        setProduct(productData)
        setCategories(categoriesData)
        setBrandOptions(brandOptionsData)
      })
      .catch(() => router.replace('/admin/products'))
      .finally(() => {
        if (active) setLoadingData(false)
      })

    return () => {
      active = false
    }
  }, [id, loading, router, session])

  if (loading || loadingData || !product) return <PageLoader />

  return (
    <AdminEditProductClient
      product={product}
      categories={categories}
      brandOptions={brandOptions}
    />
  )
}

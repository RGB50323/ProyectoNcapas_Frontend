'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getBrandOptions, getCategories, getProduct } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageLoader } from '@/components/PageLoader'
import type { BrandOption, Category, Product } from '@/lib/types'
import EditProductClient from './EditProductClient'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
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
          router.replace('/seller/products')
          return
        }
        setProduct(productData)
        setCategories(categoriesData)
        setBrandOptions(brandOptionsData)
      })
      .catch(() => router.replace('/seller/products'))
      .finally(() => {
        if (active) setLoadingData(false)
      })

    return () => {
      active = false
    }
  }, [id, loading, router, session])

  if (loading || loadingData || !product) return <PageLoader />

  return (
    <EditProductClient
      product={product}
      categories={categories}
      brandOptions={brandOptions}
      mode={searchParams.get('mode') ?? undefined}
    />
  )
}

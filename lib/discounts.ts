// Descuentos por estrategia (OCP): agregar un tipo = nueva entrada, sin tocar el carrito
import type { CartLine, Coupon, DiscountType } from './types'

export interface DiscountContext {
  lines: CartLine[]
  subtotal: number
}

export interface DiscountResult {
  discountAmount: number
  freeShipping: boolean
  label: string
}

export interface DiscountStrategy {
  type: DiscountType
  apply(ctx: DiscountContext, coupon: Coupon): DiscountResult
}

const percentOff: DiscountStrategy = {
  type: 'PERCENT',
  apply: (ctx, c) => ({
    discountAmount: Math.round(ctx.subtotal * (c.value / 100)),
    freeShipping: false,
    label: `${c.code} · ${c.value}% de descuento`,
  }),
}

const fixedOff: DiscountStrategy = {
  type: 'FIXED',
  apply: (ctx, c) => ({
    discountAmount: Math.min(c.value, ctx.subtotal),
    freeShipping: false,
    label: `${c.code} · $${c.value} de descuento`,
  }),
}

const freeShipping: DiscountStrategy = {
  type: 'SHIPPING',
  apply: (_ctx, c) => ({
    discountAmount: 0,
    freeShipping: true,
    label: `${c.code} · Envío gratis`,
  }),
}

// 2x1: por cada par de accesorios, la unidad más barata sale gratis
const bogo: DiscountStrategy = {
  type: 'BOGO',
  apply: (ctx, c) => {
    const unitPrices: number[] = []
    ctx.lines
      .filter((l) => l.product.category === 'accessories')
      .forEach((l) => {
        for (let i = 0; i < l.qty; i++) unitPrices.push(l.product.price)
      })
    unitPrices.sort((a, b) => a - b)
    const freeUnits = Math.floor(unitPrices.length / 2)
    const discountAmount = unitPrices.slice(0, freeUnits).reduce((s, p) => s + p, 0)
    return { discountAmount, freeShipping: false, label: `${c.code} · 2x1 en accesorios` }
  },
}

// Registro (Factory por tipo)
export const DISCOUNT_STRATEGIES: Record<DiscountType, DiscountStrategy> = {
  PERCENT: percentOff,
  FIXED: fixedOff,
  SHIPPING: freeShipping,
  BOGO: bogo,
}

const EMPTY: DiscountResult = { discountAmount: 0, freeShipping: false, label: '' }

export function applyCoupon(ctx: DiscountContext, coupon: Coupon | null | undefined): DiscountResult {
  if (!coupon) return EMPTY
  const strategy = DISCOUNT_STRATEGIES[coupon.type]
  if (!strategy) return { ...EMPTY, label: 'Cupón no válido' }
  return strategy.apply(ctx, coupon)
}

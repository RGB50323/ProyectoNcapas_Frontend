import type {
  Product, Category, Coupon, ShippingMethod, Drop, Order, Review, ProductColor, Variant,
} from './types'

export const BRANDS = [
  'LABWORKS', 'VAULT.STD', 'MONOCHROME', 'K-SELECT', 'ARCHIVE', 'UTILITY DIV.', 'SHADOW CO.',
]

export const CATEGORIES: Category[] = [
  { id: 'sneakers', name: 'Tenis', count: 48 },
  { id: 'streetwear', name: 'Ropa urbana', count: 36 },
  { id: 'hoodies', name: 'Sudaderas', count: 22 },
  { id: 'tees', name: 'Camisetas', count: 31 },
  { id: 'caps', name: 'Gorras', count: 14 },
  { id: 'accessories', name: 'Accesorios', count: 19 },
]

export const stripeImg = (label: string, h1: string, h2: string, accent?: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 750' preserveAspectRatio='xMidYMid slice'>
    <defs>
      <pattern id='p' width='14' height='14' patternUnits='userSpaceOnUse' patternTransform='rotate(35)'>
        <rect width='14' height='14' fill='${h1}'/>
        <rect width='7' height='14' fill='${h2}'/>
      </pattern>
    </defs>
    <rect width='600' height='750' fill='url(#p)'/>
    <rect x='40' y='620' width='${20 + label.length * 9}' height='32' fill='#0a0a0a'/>
    <text x='52' y='642' font-family='ui-monospace, Menlo, monospace' font-size='13' fill='${accent || '#ffffff'}' letter-spacing='1.5'>${label}</text>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

const PALETTES = [
  ['#f4f1ea', '#e8e3d6'],
  ['#ecece8', '#dcd9d2'],
  ['#efe9df', '#dfd6c5'],
  ['#e8eaed', '#d5d8dc'],
  ['#f0e8e2', '#dfd1c4'],
  ['#ebeae5', '#d4d2cb'],
]

const mkImages = (slug: string, n: number) => {
  const arr: string[] = []
  for (let i = 0; i < n; i++) {
    const p = PALETTES[(slug.charCodeAt(0) + i) % PALETTES.length]
    arr.push(stripeImg(`${slug}_0${i + 1}.tif`, p[0], p[1]))
  }
  return arr
}

const SIZES_SNEAKER = ['US 7', 'US 7.5', 'US 8', 'US 8.5', 'US 9', 'US 9.5', 'US 10', 'US 10.5', 'US 11', 'US 12']
const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SIZES_CAP = ['Talla única']

const mkVariants = (sizes: string[], colors: ProductColor[], baseStock = 8): Variant[] => {
  const out: Variant[] = []
  sizes.forEach((s, i) => {
    colors.forEach((c) => {
      const stock = (i % 7 === 0) ? 0 : (i % 5 === 0 ? 2 : (i % 3 === 0 ? baseStock + 6 : baseStock))
      out.push({ size: s, color: c.name, colorHex: c.hex, stock, priceDelta: 0 })
    })
  })
  return out
}

type ProductSeed =
  Omit<Product, 'variants' | 'totalStock' | 'lowStock' | 'soldOut' | 'featured' | 'isNew' | 'limited' | 'privateDrop'>
  & Partial<Pick<Product, 'featured' | 'isNew' | 'limited' | 'privateDrop'>>

const SEED: ProductSeed[] = [
  {
    id: 'p01', sku: 'KL-SR01-BLK', name: 'Sombra Runner 01', brand: 'LABWORKS',
    category: 'sneakers', price: 240, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['LIMITADO', 'VERIFICADO'], featured: true, isNew: true, limited: true,
    images: mkImages('SR01', 4),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Ónix', hex: '#0c0c0e' }, { name: 'Hueso', hex: '#e8e3d6' }],
    rating: 4.8, reviews: 142,
    desc: 'Runner de perfil bajo con upper de malla técnica, herrajes en negro total y entresuela de phylon vulcanizada. Hecho para la rotación diaria.',
  },
  {
    id: 'p02', sku: 'KL-AL02-CRM', name: 'Archivo Baja Crema', brand: 'ARCHIVE',
    category: 'sneakers', price: 320, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['VERIFICADO'], featured: true,
    images: mkImages('AL02', 4),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Crema', hex: '#e9dfc8' }, { name: 'Arena', hex: '#c9b896' }],
    rating: 4.7, reviews: 89,
    desc: 'Reedición del programa de archivo. Cuero martillado, entresuela de espuma cruda y bordes terminados a mano.',
  },
  {
    id: 'p03', sku: 'KL-VH03-BLK', name: 'Bóveda Alta Negra', brand: 'VAULT.STD',
    category: 'sneakers', price: 410, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['LIMITADO', 'DROP PRIVADO', 'VERIFICADO'], privateDrop: true, limited: true,
    images: mkImages('VH03', 4),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Negro', hex: '#0a0a0a' }],
    rating: 4.9, reviews: 47,
    desc: 'Lanzamiento solo para la bóveda. Cuero plena flor, contrafuerte tejido y cuello de tobillo extendido. Solo miembros.',
  },
  {
    id: 'p04', sku: 'KL-LR04-VLT', name: 'Lab Runner Volt', brand: 'LABWORKS',
    category: 'sneakers', price: 220, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['NUEVO'], isNew: true,
    images: mkImages('LR04', 3),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Volt', hex: '#cfd62f' }, { name: 'Humo', hex: '#3a3a3e' }],
    rating: 4.5, reviews: 23,
    desc: 'Suela volt firma de K Lab. Tejido ingenieril. Jaula de talón en laminado de carbono.',
  },
  {
    id: 'p05', sku: 'KL-MC05-BLK', name: 'Pantalón Cargo Monocromo', brand: 'MONOCHROME',
    category: 'streetwear', price: 180, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['NUEVO'], isNew: true,
    images: mkImages('MC05', 3),
    sizes: SIZES_APPAREL, colors: [{ name: 'Negro', hex: '#0a0a0a' }, { name: 'Piedra', hex: '#7a766c' }],
    rating: 4.6, reviews: 64,
    desc: 'Ripstop de algodón de peso medio. Rodillas articuladas. Bolsillos utilitarios con cierre oculto.',
  },
  {
    id: 'p06', sku: 'KL-ET06-WHT', name: 'Camiseta Oversize Esencial', brand: 'K-SELECT',
    category: 'tees', price: 60, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: [],
    images: mkImages('ET06', 2),
    sizes: SIZES_APPAREL, colors: [{ name: 'Hueso', hex: '#e8e3d6' }, { name: 'Negro', hex: '#0a0a0a' }, { name: 'Humo', hex: '#3a3a3e' }],
    rating: 4.4, reviews: 318,
    desc: 'Algodón peinado de 240gsm. Corte holgado. Hombro caído. Estampado de pecho K LAB prensado a mano.',
  },
  {
    id: 'p07', sku: 'KL-CH07-WSH', name: 'Sudadera Lavada Coleccionista', brand: 'ARCHIVE',
    category: 'hoodies', price: 220, condition: 'USED', auth: 'AUTHENTICATED',
    badges: ['SEMINUEVO', 'VERIFICADO'],
    images: mkImages('CH07', 3),
    sizes: SIZES_APPAREL, colors: [{ name: 'Negro lavado', hex: '#1d1c1a' }],
    rating: 4.8, reviews: 12,
    desc: 'Lavado vintage. Fleece pesado de 14oz. Inspeccionada y reacondicionada por nuestro Laboratorio de Autenticación.',
  },
  {
    id: 'p08', sku: 'KL-PD08-CAP', name: 'Gorra Drop Privado', brand: 'K-SELECT',
    category: 'caps', price: 80, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['DROP PRIVADO', 'LIMITADO'], privateDrop: true, limited: true,
    images: mkImages('PD08', 2),
    sizes: SIZES_CAP, colors: [{ name: 'Negro', hex: '#0a0a0a' }, { name: 'Rojo', hex: '#d92626' }],
    rating: 4.7, reviews: 31,
    desc: 'Modelo de 6 paneles solo para miembros. Sarga cepillada, correa de cuero y etiqueta de laboratorio en relieve.',
  },
  {
    id: 'p09', sku: 'KL-UC09-BAG', name: 'Bolso Cruzado Utility', brand: 'UTILITY DIV.',
    category: 'accessories', price: 140, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['POCO STOCK'],
    images: mkImages('UC09', 3),
    sizes: SIZES_CAP, colors: [{ name: 'Negro', hex: '#0a0a0a' }],
    rating: 4.3, reviews: 27,
    desc: 'Carcasa de nylon balístico. Compartimento principal con doble cierre. Banda reflectiva de laboratorio en la correa.',
  },
  {
    id: 'p10', sku: 'KL-HT10-HV', name: 'Camiseta Pesada K Lab', brand: 'K-SELECT',
    category: 'tees', price: 75, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['NUEVO'], isNew: true,
    images: mkImages('HT10', 2),
    sizes: SIZES_APPAREL, colors: [{ name: 'Hueso', hex: '#e8e3d6' }, { name: 'Negro', hex: '#0a0a0a' }],
    rating: 4.5, reviews: 88,
    desc: 'Peso pesado de 320gsm. Teñida en prenda. Etiqueta interior codificada del laboratorio.',
  },
  {
    id: 'p11', sku: 'KL-DJ11-IND', name: 'Chaqueta Denim Archivo', brand: 'ARCHIVE',
    category: 'streetwear', price: 280, condition: 'USED', auth: 'AUTHENTICATED',
    badges: ['SEMINUEVO', 'VERIFICADO'],
    images: mkImages('DJ11', 3),
    sizes: SIZES_APPAREL, colors: [{ name: 'Índigo', hex: '#1f2a3a' }],
    rating: 4.6, reviews: 9,
    desc: 'Trucker en denim selvedge. Pátina honesta. Pieza autenticada por el laboratorio, condición calificada 8.4/10.',
  },
  {
    id: 'p12', sku: 'KL-CC12-CRM', name: 'Court Crema Baja', brand: 'LABWORKS',
    category: 'sneakers', price: 195, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: [],
    images: mkImages('CC12', 3),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Crema', hex: '#e9dfc8' }, { name: 'Goma', hex: '#9b6a3e' }],
    rating: 4.4, reviews: 51,
    desc: 'Silueta court en cuero martillado. Suela de goma. Detalle de gamuza lateral.',
  },
  {
    id: 'p13', sku: 'KL-SR13-PRO', name: 'Humo Runner Pro', brand: 'SHADOW CO.',
    category: 'sneakers', price: 260, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: ['POCO STOCK', 'VERIFICADO'],
    images: mkImages('SR13', 4),
    sizes: SIZES_SNEAKER, colors: [{ name: 'Humo', hex: '#3a3a3e' }, { name: 'Hueso', hex: '#e8e3d6' }],
    rating: 4.7, reviews: 73,
    desc: 'Entrenador de rendimiento. Clip de talón en TPU. Logo reflectivo en la lengüeta.',
  },
  {
    id: 'p14', sku: 'KL-LC14-CAP', name: 'Gorra Logo Lab', brand: 'K-SELECT',
    category: 'caps', price: 55, condition: 'NEW', auth: 'AUTHENTICATED',
    badges: [],
    images: mkImages('LC14', 2),
    sizes: SIZES_CAP, colors: [{ name: 'Negro', hex: '#0a0a0a' }, { name: 'Piedra', hex: '#7a766c' }, { name: 'Crema', hex: '#e9dfc8' }],
    rating: 4.2, reviews: 119,
    desc: 'Gorra de 6 paneles sin estructura. Visera curva. Bordado en cadena K LAB.',
  },
  {
    id: 'p15', sku: 'KL-WH15-BLK', name: 'Sudadera Negra Lavada', brand: 'MONOCHROME',
    category: 'hoodies', price: 170, condition: 'NEW', auth: 'NOT_SUBMITTED',
    badges: [],
    images: mkImages('WH15', 2),
    sizes: SIZES_APPAREL, colors: [{ name: 'Negro lavado', hex: '#1d1c1a' }],
    rating: 4.6, reviews: 42,
    desc: 'Pullover pesado teñido por pigmento. Corte holgado. Costuras tonales.',
  },
  {
    id: 'p16', sku: 'KL-TN16-NYL', name: 'Pantalón Nylon Técnico', brand: 'UTILITY DIV.',
    category: 'streetwear', price: 210, condition: 'NEW', auth: 'NOT_SUBMITTED',
    badges: ['NUEVO'], isNew: true,
    images: mkImages('TN16', 3),
    sizes: SIZES_APPAREL, colors: [{ name: 'Negro', hex: '#0a0a0a' }, { name: 'Oliva', hex: '#3c3d24' }],
    rating: 4.5, reviews: 18,
    desc: 'Nylon con recubrimiento DWR. Bastilla ajustable. Expansión cargo oculta.',
  },
]

export const PRODUCTS: Product[] = SEED.map((p) => {
  const sizes = p.category === 'sneakers' ? SIZES_SNEAKER
    : (p.category === 'caps' || p.category === 'accessories') ? SIZES_CAP
      : SIZES_APPAREL
  const variants = mkVariants(sizes, p.colors)
  const totalStock = variants.reduce((s, v) => s + v.stock, 0)
  return {
    featured: false, isNew: false, limited: false, privateDrop: false,
    ...p,
    variants,
    totalStock,
    lowStock: variants.filter((v) => v.stock > 0 && v.stock <= 3).length,
    soldOut: totalStock === 0,
  }
})

export const COUPONS: Coupon[] = [
  { code: 'KLAB10', label: '10% de descuento', type: 'PERCENT', value: 10, active: true, uses: 142, max: 500 },
  { code: 'VAULT25', label: '$25 de descuento', type: 'FIXED', value: 25, active: true, uses: 33, max: 200 },
  { code: 'ENVIOGRATIS', label: 'Envío gratis', type: 'SHIPPING', value: 0, active: true, uses: 211, max: 1000 },
  { code: 'BOGO-LAB', label: '2x1 en accesorios', type: 'BOGO', value: 0, active: false, uses: 18, max: 100 },
]

export const SHIPPING: ShippingMethod[] = [
  { id: 'standard', name: 'Entrega estándar', fee: 8, eta: '5–8 días' },
  { id: 'express', name: 'Entrega exprés', fee: 22, eta: '2–3 días' },
  { id: 'national', name: 'Entrega nacional', fee: 14, eta: '3–5 días' },
  { id: 'pickup', name: 'Recoger en tienda', fee: 0, eta: 'Mismo día' },
]

export const DROPS: Drop[] = [
  { id: 'd1', title: 'Bóveda Alta — Fase II', date: '02 JUN · 18:00 GMT', units: 80, type: 'DROP PRIVADO', img: stripeImg('DROP_VLT02.tif', '#f4f1ea', '#e8e3d6') },
  { id: 'd2', title: 'Reedición Archivo / Court Crema', date: '09 JUN · 12:00 GMT', units: 240, type: 'PÚBLICO', img: stripeImg('DROP_ARCH09.tif', '#efe9df', '#dfd6c5') },
  { id: 'd3', title: 'Lab Runner — Edición Volt', date: '16 JUN · 09:00 GMT', units: 150, type: 'PÚBLICO', img: stripeImg('DROP_LAB16.tif', '#ecece8', '#dcd9d2') },
  { id: 'd4', title: 'Cápsula Shadow Co.', date: '24 JUN · 20:00 GMT', units: 60, type: 'DROP PRIVADO', img: stripeImg('DROP_SHD24.tif', '#e8eaed', '#d5d8dc') },
]

export const ORDERS: Order[] = [
  { id: 'KL-24102', status: 'DELIVERED', date: '14 may 2026', total: 412, items: 2, tracking: 'DHL-882-114-002' },
  { id: 'KL-24138', status: 'SHIPPED', date: '22 may 2026', total: 240, items: 1, tracking: 'DHL-882-114-138' },
  { id: 'KL-24199', status: 'PREPARING', date: '26 may 2026', total: 595, items: 3, tracking: '—' },
]

export const REVIEWS: Review[] = [
  {
    id: 'review-1',
    productId: 'mock-product-1',
    productName: 'Producto verificado',
    userId: 'mock-user-1',
    userFirstName: 'MARCO',
    userLastName: 'V.',
    rating: 5,
    body: 'La calidad de construcción es increíble. El par más limpio que he recibido en años. La etiqueta del laboratorio confirmó el serial.',
    isVerifiedPurchase: true,
    createdAt: '2026-05-14T12:00:00Z',
  },
  {
    id: 'review-2',
    productId: 'mock-product-1',
    productName: 'Producto verificado',
    userId: 'mock-user-2',
    userFirstName: 'K.',
    userLastName: 'R.',
    rating: 5,
    body: 'Valió la espera. La caja venía sellada, el papel intacto. Talla fiel a US 9. El laboratorio sabe.',
    isVerifiedPurchase: true,
    createdAt: '2026-05-10T12:00:00Z',
  },
  {
    id: 'review-3',
    productId: 'mock-product-1',
    productName: 'Producto verificado',
    userId: 'mock-user-3',
    userFirstName: 'DANI',
    userLastName: 'L.',
    rating: 4,
    body: 'Gran par. El color salió un poco más oscuro de lo que esperaba en las fotos, pero me encantan.',
    isVerifiedPurchase: true,
    createdAt: '2026-04-28T12:00:00Z',
  },
]

import type { Metadata } from 'next'
import { Anton, Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth'
import { CartProvider } from '@/lib/cart'
import { WishlistProvider } from '@/lib/wishlist'
import './globals.css'

const anton = Anton({
  variable: '--font-anton',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'K LAB by Mister K — Sneakers Curados. Piezas Verificadas.',
  description: 'Un laboratorio de autenticación. Sneakers curados, piezas verificadas, streetwear premium. Cada pieza inspeccionada a mano.',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-SV" className={`${anton.variable} ${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Header />
      {children}
      <Footer />
    </div>
  )
}

import Link from 'next/link'
import { getDrops } from '@/lib/api'
import DropsClient from './DropsClient'

export default async function DropsPage() {
  const drops = await getDrops()
  return <DropsClient drops={drops} />
}
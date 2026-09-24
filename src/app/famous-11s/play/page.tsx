import type { Metadata } from 'next'
import { Famous11sGame } from '@/components/famous11s/Famous11sGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function Famous11sPlayPage() {
  return <Famous11sGame />
}

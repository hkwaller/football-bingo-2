import type { Metadata } from 'next'
import { CareersGame } from '@/components/careers/CareersGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function CareersPlayPage() {
  return <CareersGame />
}

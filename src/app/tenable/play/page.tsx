import type { Metadata } from 'next'
import { TenableGame } from '@/components/tenable/TenableGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function TenablePlayPage() {
  return <TenableGame />
}

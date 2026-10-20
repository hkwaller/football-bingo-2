import type { Metadata } from 'next'
import { ConnectionsGame } from '@/components/connections/ConnectionsGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function ConnectionsPlayPage() {
  return <ConnectionsGame />
}

import { notFound } from 'next/navigation'

import { ADS_ENABLED } from '@/lib/ads'

export default function Layout({ children }: { children: React.ReactNode }) {
  // No ads, nothing to remove.
  if (!ADS_ENABLED) notFound()
  return children
}

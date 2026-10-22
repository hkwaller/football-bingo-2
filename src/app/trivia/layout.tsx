import type { ReactNode } from 'react'
import { PRIVATE_METADATA } from '@/lib/seo'

export const metadata = PRIVATE_METADATA

export default function Layout({ children }: { children: ReactNode }) {
  return children
}

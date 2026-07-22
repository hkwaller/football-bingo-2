import { Suspense } from 'react'
import { TenableSetup } from '@/components/tenable/TenableSetup'

export default function TenableSetupPage() {
  return (
    <Suspense>
      <TenableSetup />
    </Suspense>
  )
}

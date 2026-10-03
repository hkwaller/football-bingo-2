import type { Metadata } from 'next'
import { CareersSetup } from '@/components/careers/CareersSetup'

export const metadata: Metadata = {
  title: 'Play Careers',
  description:
    'Years and clubs, nothing else. Name the footballer from his career path - loans included.',
  alternates: { canonical: '/careers/setup' },
}

export default function CareersSetupPage() {
  return <CareersSetup />
}

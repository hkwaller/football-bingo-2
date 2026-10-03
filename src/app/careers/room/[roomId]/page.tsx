import type { Metadata } from 'next'
import { CareersRoomGame } from '@/components/careers/CareersRoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function CareersRoomPage({ params }: Props) {
  const { roomId } = await params
  return <CareersRoomGame roomId={roomId} />
}

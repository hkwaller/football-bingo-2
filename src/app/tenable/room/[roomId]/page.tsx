import type { Metadata } from 'next'
import { TenableRoomGame } from '@/components/tenable/TenableRoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function TenableRoomPage({ params }: Props) {
  const { roomId } = await params
  return <TenableRoomGame roomId={roomId} />
}

import type { Metadata } from 'next'
import { RoomGame } from '@/components/RoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <RoomGame roomId={roomId} />
}

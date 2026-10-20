import type { Metadata } from 'next'
import { ConnectionsRoomGame } from '@/components/connections/ConnectionsRoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function ConnectionsRoomPage({ params }: Props) {
  const { roomId } = await params
  return <ConnectionsRoomGame roomId={roomId} />
}

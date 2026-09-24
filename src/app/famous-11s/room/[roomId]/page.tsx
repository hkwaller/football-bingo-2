import type { Metadata } from 'next'
import { Famous11sRoomGame } from '@/components/famous11s/Famous11sRoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function Famous11sRoomPage({ params }: Props) {
  const { roomId } = await params
  return <Famous11sRoomGame roomId={roomId} />
}

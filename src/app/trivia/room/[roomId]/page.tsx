import type { Metadata } from 'next'
import { TriviaRoomGame } from '@/components/trivia/TriviaRoomGame'

export const metadata: Metadata = { robots: { index: false, follow: false } }

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function TriviaRoomPage({ params }: Props) {
  const { roomId } = await params
  return <TriviaRoomGame roomId={roomId} />
}

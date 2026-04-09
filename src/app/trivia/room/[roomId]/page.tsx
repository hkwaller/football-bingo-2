import { TriviaRoomGame } from '@/components/trivia/TriviaRoomGame'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function TriviaRoomPage({ params }: Props) {
  const { roomId } = await params
  return <TriviaRoomGame roomId={roomId} />
}

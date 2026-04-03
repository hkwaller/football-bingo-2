import { RoomGame } from '@/components/RoomGame'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  return <RoomGame roomId={roomId} />
}

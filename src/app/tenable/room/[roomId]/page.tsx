import { TenableRoomGame } from '@/components/tenable/TenableRoomGame'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function TenableRoomPage({ params }: Props) {
  const { roomId } = await params
  return <TenableRoomGame roomId={roomId} />
}

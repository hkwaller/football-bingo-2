'use client'

import { getTenableQuestionById } from '@/data/tenable'
import type { TenableConfig } from '@/lib/tenable/types'
import { RoomInvite } from '@/components/RoomInvite'
import { LobbyNameField } from '@/components/LobbyNameField'
import { LobbyPickedCard, LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbyBar } from '@/components/setup/LobbyBar'
import { ROOM_PLAY_MODE_LABEL } from '@/lib/roomMode'

interface Player {
  id: string
  displayName: string
  isHost: boolean
  isSelf?: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: TenableConfig
  onStart: () => void
  myName?: string
  onRename?: (name: string) => void
}

export function TenableLobby({
  roomId,
  players,
  isHost,
  config,
  onStart,
  myName = '',
  onRename,
}: Props) {
  const picked = config.selectedQuestionId
    ? getTenableQuestionById(config.selectedQuestionId)
    : undefined
  const topicLabel = config.groups === 'all' ? 'All topics' : config.groups.join(', ')
  const coop = config.playMode === 'coop'
  const modeLabel = ROOM_PLAY_MODE_LABEL[config.playMode ?? 'versus']
  const listLabel = picked
    ? picked.category
    : `${config.questionCount} list${config.questionCount === 1 ? '' : 's'}`
  const livesLabel = `${config.lives} ${coop ? 'shared' : 'each'}`

  return (
    <LobbyLayout
      isHost={isHost}
      eyebrow="Tenable · turn-based"
      eyebrowTone="sky"
      title="The squad gathers"
      subtitle={
        coop
          ? 'Take turns naming the ten. Shared lives, one team score.'
          : 'Take turns naming the ten. Own lives, own points - top scorer wins.'
      }
      invite={<RoomInvite roomId={roomId} joinPath={`/tenable/room/${roomId}`} />}
      squad={<LobbySquad players={players} />}
      settings={
        <>
          {picked && <LobbyPickedCard label="The list" title={picked.category} />}
          <dl>
            <LobbySettingRow label="Mode" value={modeLabel} />
            {!picked && <LobbySettingRow label="Categories" value={String(config.questionCount)} />}
            {!picked && <LobbySettingRow label="Topic" value={topicLabel} />}
            <LobbySettingRow
              label="Difficulty"
              value={picked ? picked.difficulty : config.difficulty}
            />
            <LobbySettingRow label="Lives" value={livesLabel} />
            <LobbySettingRow
              label="Hints"
              value={config.hints === 0 ? 'Off' : `${config.hints} ${coop ? 'shared' : 'each'}`}
            />
          </dl>
        </>
      }
      changeSettingsHref="/tenable/setup?mode=multiplayer"
      nameField={
        <LobbyNameField
          value={myName}
          onSave={(n) => onRename?.(n)}
          autoFocus={!isHost && !myName}
        />
      }
      bar={
        <LobbyBar
          isHost={isHost}
          playerCount={players.length}
          fields={[
            { label: 'Mode', value: modeLabel },
            { label: picked ? 'The list' : 'Lists', value: listLabel },
            { label: 'Lives', value: livesLabel },
          ]}
          mobileDetail={`${modeLabel} · ${listLabel} · ${config.lives} lives ${coop ? 'shared' : 'each'}`}
          hint="Take turns naming the ten"
          startLabel="Start match"
          onStart={onStart}
          disabled={players.length < 1}
        />
      }
    />
  )
}

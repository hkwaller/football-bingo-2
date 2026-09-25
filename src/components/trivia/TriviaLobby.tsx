'use client'

import type { TriviaConfig } from '@/lib/trivia/types'
import { DIFFICULTY_LABELS } from '@/lib/trivia/difficulty'
import { RoomInvite } from '@/components/RoomInvite'
import { LobbyNameField } from '@/components/LobbyNameField'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'
import { LobbyLayout } from '@/components/LobbyLayout'
import { LobbyBar } from '@/components/setup/LobbyBar'

interface Player {
  connectionId: number
  displayName: string
  isHost: boolean
  isSelf?: boolean
}

interface Props {
  roomId: string
  players: Player[]
  isHost: boolean
  config: TriviaConfig
  onStart: () => void
  onConfigChange?: (config: TriviaConfig) => void
  myName?: string
  onRename?: (name: string) => void
}

export function TriviaLobby({
  roomId,
  players,
  isHost,
  config,
  onStart,
  myName = '',
  onRename,
}: Props) {
  const sessionLabel: Record<string, string> = {
    fixed: `Fixed (${config.questionCount} questions)`,
    survival: 'Survival',
    timed: `Timed (${config.timeLimitSeconds}s)`,
    category: `Category: ${config.category}`,
  }

  const mechanicLabel: Record<string, string> = {
    race: 'Race - first correct wins',
    simultaneous: 'Simultaneous - everyone answers',
    'turn-based': 'Turn-based',
  }

  const shortSession: Record<string, string> = {
    fixed: `${config.questionCount} questions`,
    survival: 'Survival',
    timed: `${config.timeLimitSeconds}s timed`,
    category: config.category ?? 'Category',
  }
  const shortMechanic: Record<string, string> = {
    race: 'Race',
    simultaneous: 'Simultaneous',
    'turn-based': 'Turn-based',
  }
  const sessionValue = shortSession[config.sessionType] ?? config.sessionType
  const mechanicValue = shortMechanic[config.multiplayerMechanic] ?? config.multiplayerMechanic
  const difficultyValue = DIFFICULTY_LABELS[config.difficulty]

  return (
    <LobbyLayout
      isHost={isHost}
      eyebrow="Pre-match · tunnel"
      title="The squad gathers"
      subtitle="Share the code - everyone plays from their own device."
      invite={<RoomInvite roomId={roomId} joinPath={`/trivia/room/${roomId}`} />}
      squad={<LobbySquad players={players.map((p) => ({ ...p, id: p.connectionId }))} />}
      settings={
        <dl>
          <LobbySettingRow
            label="Session"
            value={sessionLabel[config.sessionType] ?? config.sessionType}
          />
          <LobbySettingRow label="Difficulty" value={difficultyValue} />
          <LobbySettingRow
            label="Mechanic"
            value={mechanicLabel[config.multiplayerMechanic] ?? config.multiplayerMechanic}
          />
        </dl>
      }
      changeSettingsHref="/trivia/setup"
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
            { label: 'Session', value: sessionValue },
            { label: 'Difficulty', value: difficultyValue },
            { label: 'Mechanic', value: mechanicValue },
          ]}
          mobileDetail={`${sessionValue} · ${difficultyValue} · ${mechanicValue}`}
          hint="Everyone plays from their own device"
          startLabel="Start match"
          onStart={onStart}
          disabled={players.length < 1}
        />
      }
    />
  )
}

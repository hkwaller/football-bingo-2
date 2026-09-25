'use client'

import { motion } from 'framer-motion'
import type { TriviaConfig } from '@/lib/trivia/types'
import { DIFFICULTY_LABELS } from '@/lib/trivia/difficulty'
import { RoomInvite } from '@/components/RoomInvite'
import { LobbySettingRow, LobbySquad } from '@/components/LobbySquad'

interface Player {
  connectionId: number
  displayName: string
  isHost: boolean
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

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-7 px-6 py-8 md:px-9 md:py-10">
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <span className="eyebrow">Pre-match · tunnel</span>
        <h1 className="mt-3 font-display text-[48px] font-black uppercase leading-[0.9] text-on-green md:text-[56px]">
          The squad gathers
        </h1>
        <p className="mt-3 text-[14.5px] font-semibold text-on-green-soft">
          Share the code below - everyone plays from their own device.
        </p>
      </motion.div>

      {/* Config summary */}
      <div className="panel p-6">
        <p className="eyebrow mb-4">Match settings</p>
        <dl>
          <LobbySettingRow
            label="Session"
            value={sessionLabel[config.sessionType] ?? config.sessionType}
          />
          <LobbySettingRow label="Difficulty" value={DIFFICULTY_LABELS[config.difficulty]} />
          <LobbySettingRow
            label="Mechanic"
            value={mechanicLabel[config.multiplayerMechanic] ?? config.multiplayerMechanic}
          />
        </dl>
        {isHost && (
          <a
            href="/trivia/setup"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.06em] text-red hover:underline"
          >
            Change settings →
          </a>
        )}
      </div>

      <RoomInvite roomId={roomId} joinPath={`/trivia/room/${roomId}`} />

      <LobbySquad
        players={players.map((p) => ({ ...p, id: p.connectionId }))}
        myName={myName}
        onRename={(n) => onRename?.(n)}
      />

      {/* Start button (host only) */}
      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 1}
          className="btn btn-primary btn-lg disabled:cursor-not-allowed"
        >
          Start match
        </button>
      ) : (
        <p className="text-center text-sm font-semibold text-on-green-soft animate-pulse-soft">
          In the tunnel - waiting for the gaffer to start…
        </p>
      )}
    </div>
  )
}

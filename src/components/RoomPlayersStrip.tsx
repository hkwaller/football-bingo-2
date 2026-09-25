'use client'

import type { RoomPlayMode } from '@/lib/roomMode'

export interface RoomStripPlayer {
  id: string
  name: string
  score: number
  /** Lives left - only shown in versus, where lives are per player. */
  livesLeft: number
  isMe: boolean
  isTurn: boolean
}

/** In-game roster: whose turn it is, points, and (versus) each player's lives. */
export function RoomPlayersStrip({
  mode,
  players,
  teamTotal,
}: {
  mode: RoomPlayMode
  players: RoomStripPlayer[]
  teamTotal?: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {mode === 'coop' && teamTotal != null && (
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-ink">
          Team <span className="tabular-nums">{teamTotal.toLocaleString()}</span>
        </span>
      )}
      {players.map((p) => {
        const out = mode === 'versus' && p.livesLeft <= 0
        return (
          <span
            key={p.id}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-bold ${
              p.isTurn
                ? 'bg-surface text-card-ink shadow-[inset_0_0_0_2px_var(--yellow)]'
                : 'bg-black/25 text-on-green-soft'
            } ${out ? 'opacity-50' : ''}`}
          >
            <span className="max-w-[9rem] truncate">
              {p.name}
              {p.isMe && ' (you)'}
            </span>
            <span className="font-mono tabular-nums">{p.score.toLocaleString()}</span>
            {mode === 'versus' && (
              <span className="font-mono text-[11px]" aria-label={`${p.livesLeft} lives left`}>
                {out ? 'OUT' : `♥${p.livesLeft}`}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

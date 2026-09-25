'use client'

import Link from 'next/link'
import { teamScore, type RoomPlayMode } from '@/lib/roomMode'

export interface RoomResultEntry {
  id: string
  name: string
  score: number
  isMe: boolean
}

interface Props {
  mode: RoomPlayMode
  entries: RoomResultEntry[]
  newRoomHref: string
  eyebrowClass?: string
}

/** Full-time screen for turn-based rooms: a leaderboard (versus) or a team score (co-op). */
export function RoomResults({ mode, entries, newRoomHref, eyebrowClass = '' }: Props) {
  const ranked = [...entries].sort((a, b) => b.score - a.score)
  const total = teamScore(entries.map((e) => e.score))
  // Shares are of the points scored; penalties can push a contribution below 0.
  const scored = teamScore(entries.map((e) => Math.max(0, e.score)))

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-6 py-8 md:px-9">
      <div className="text-center">
        <span className={`eyebrow ${eyebrowClass}`}>
          Full time · {mode === 'coop' ? 'Co-op' : 'Versus'}
        </span>
        <h1 className="mt-2 font-display text-[56px] font-black uppercase leading-none text-on-green">
          {mode === 'coop' ? 'Team result' : 'Results'}
        </h1>
      </div>

      {mode === 'coop' ? (
        <div className="panel p-6">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
            Team score
          </p>
          <p className="mt-1 text-center font-display text-[64px] font-black leading-none text-card-ink tabular-nums">
            {total.toLocaleString()}
          </p>

          <div className="mt-6 border-t-2 border-dashed border-card-tint pt-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-card-muted-2">
              Contributions
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {ranked.map((e) => {
                const share = scored > 0 ? Math.round((Math.max(0, e.score) / scored) * 100) : 0
                return (
                  <li key={e.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-bold text-card-ink">
                        {e.name}
                        {e.isMe && ' (you)'}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-bold text-card-muted tabular-nums">
                        {e.score.toLocaleString()} · {share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card-tint">
                      <div
                        className={`h-full rounded-full ${e.isMe ? 'bg-yellow' : 'bg-green-go'}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ranked.map((e, i) => (
            <div
              key={e.id}
              className={`panel flex items-center gap-4 px-4 py-3 ${i === 0 ? 'border-2 border-foil' : e.isMe ? 'border-2 border-green' : ''}`}
            >
              <span
                className={`w-8 font-display text-2xl uppercase leading-none tabular-nums ${i === 0 ? 'text-gold' : 'text-muted'}`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-bold text-ink">
                {i === 0 && <span className="mr-1.5">🏆</span>}
                {e.name}
                {e.isMe && ' (you)'}
              </span>
              <span
                className={`font-display text-xl uppercase leading-none tabular-nums ${i === 0 ? 'text-gold' : 'text-ink'}`}
              >
                {e.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        <Link href={newRoomHref} className="btn btn-outline-light btn-lg">
          New room
        </Link>
        <Link href="/" className="btn btn-ghost btn-lg">
          Home
        </Link>
      </div>
    </div>
  )
}

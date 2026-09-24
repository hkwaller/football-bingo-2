'use client'

import Link from 'next/link'
import { Check, Crown, Hourglass, SkipForward, X } from 'lucide-react'

/** Roundel colours, in join order. Ink text on all of them (contrast). */
export const PLAYER_COLORS = ['bg-yellow', 'bg-sky', 'bg-coral', 'bg-green-go'] as const
const RING_COLORS = ['#ffd62e', '#6fd3f2', '#ff5b45', '#3ddc84'] as const

export type RoomPlayer = {
  id: number
  name: string
  isSelf: boolean
  colorIndex: number
  bingo: boolean
  bingoAt: number | null
  guesses: number
  solvedCount: number
  /** Filled squares in placement order (individual boards only). */
  solvedCells: number[]
  /** This player's status for the current moment, already resolved per room mode. */
  status: { kind: 'placed' | 'missed' | 'skipped' | 'playing' | 'vote' | 'novote'; label?: string } | null
  /** Hide this player's most recent pick on their mini board (same-player rounds). */
  hideLastPick: boolean
}

export type RoomMode = 'same' | 'own' | 'shared' | 'free'

export function Roundel({ player, size = 34 }: { player: RoomPlayer; size?: number }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-display font-black uppercase leading-none text-ink ${
        PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length]
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden
    >
      {player.name.charAt(0) || '?'}
    </span>
  )
}

function StatusChip({ status }: { status: RoomPlayer['status'] }) {
  if (!status) return null
  const base =
    'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[5px] border-[1.5px] border-ink px-2 py-[3px] text-[11px] font-extrabold uppercase tracking-[0.05em] text-ink'
  switch (status.kind) {
    case 'placed':
      return <span className={`${base} bg-green-go`}><Check className="size-3" strokeWidth={3} aria-hidden />Placed</span>
    case 'missed':
      return <span className={`${base} bg-coral`}><X className="size-3" strokeWidth={3} aria-hidden />Missed</span>
    case 'skipped':
      return <span className={`${base} bg-surface-2`}><SkipForward className="size-3" strokeWidth={2.5} aria-hidden />Skipped</span>
    case 'playing':
      return <span className={`${base} bg-surface-2`}><Hourglass className="size-3" strokeWidth={2.5} aria-hidden />Playing</span>
    case 'vote':
      return <span className={`${base} max-w-[120px] truncate bg-yellow`}>{status.label}</span>
    case 'novote':
      return <span className={`${base} border-card-muted text-card-muted`}>No vote</span>
  }
}

/** A tiny dot grid of one player's board: filled squares in their colour. */
export function MiniBoard({
  size,
  freeIndex,
  cells,
  colorIndex,
  hideLast,
  dot = 7,
}: {
  size: number
  freeIndex: number
  cells: number[]
  colorIndex: number
  hideLast: boolean
  dot?: number
}) {
  const hidden = hideLast && cells.length ? cells[cells.length - 1] : null
  const filled = new Set(cells)
  return (
    <span
      aria-hidden
      className="grid shrink-0 gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${size}, ${dot}px)` }}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const cls =
          i === freeIndex
            ? 'bg-yellow'
            : i === hidden
              ? 'bg-[repeating-linear-gradient(45deg,#0a2417_0_2px,#e9e1c9_2px_4px)]'
              : filled.has(i)
                ? PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]
                : 'bg-ink/[0.12]'
        return <span key={i} className={`rounded-[2px] border border-ink/35 ${cls}`} style={{ width: dot, height: dot }} />
      })}
    </span>
  )
}

/** The room scoreboard column (desktop). */
export function RoomRail({
  mode,
  players,
  total,
  boardSize,
  freeIndex,
  showMiniBoards,
  round,
  drawnName,
  waitingOn,
  votedCount,
  className = '',
}: {
  mode: RoomMode
  players: RoomPlayer[]
  total: number
  boardSize: number
  freeIndex: number
  showMiniBoards: boolean
  round: number
  drawnName: string | null
  waitingOn: string[]
  votedCount: number
  className?: string
}) {
  const miniOn = showMiniBoards && mode !== 'shared'
  return (
    <div className={`card px-[18px] pb-4 pt-[18px] ${className}`}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-card-muted">
          In the room · {players.length}
        </span>
        <span className="eyebrow rotate-2 text-[10px]">Live</span>
      </div>

      <div className="border-b-2 border-ink pb-3.5">
        {mode === 'same' ? (
          <>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
              Round {round + 1} · Everyone&apos;s on
            </p>
            <p className="mt-1 font-display text-[26px] font-black uppercase leading-[0.95] text-ink">
              {drawnName ?? 'Drawing…'}
            </p>
          </>
        ) : mode === 'shared' ? (
          <>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
              Shared board
            </p>
            <p className="mt-1 font-display text-[26px] font-black uppercase leading-[0.95] text-ink">Votes are in</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="block h-2 flex-1 overflow-hidden rounded border-[1.5px] border-ink bg-ink/[0.12]">
                <span
                  className="block h-full bg-yellow"
                  style={{ width: `${players.length ? Math.round((votedCount / players.length) * 100) : 0}%` }}
                />
              </span>
              <span className="font-mono text-[11px] font-semibold text-card-muted">
                {votedCount}/{players.length} VOTED
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-card-muted">
              {mode === 'own' ? 'Own draws' : 'Free play'}
            </p>
            <p className="mt-1 font-display text-[26px] font-black uppercase leading-[0.95] text-ink">Race to a line</p>
            {mode === 'own' ? (
              <p className="mt-1.5 text-[13px] leading-snug text-card-muted">
                Everyone&apos;s on a different player, so you only see progress.
              </p>
            ) : null}
          </>
        )}
      </div>

      <ul>
        {players.map((p) => (
          <li key={p.id} className="flex items-start gap-3 border-b-[1.5px] border-dashed border-ink/20 py-3 last:border-b-0">
            <Roundel player={p} />
            <span className="block min-w-0 flex-1">
              <span className="flex items-center justify-between gap-1.5">
                <span className="truncate font-display text-[20px] font-black uppercase leading-none text-ink">
                  {p.isSelf ? `${p.name} (you)` : p.name}
                </span>
                {p.bingo ? (
                  <span className="foil inline-flex items-center gap-1 rounded-[5px] border-[1.5px] border-ink px-2 py-[3px] text-[11px] font-extrabold uppercase tracking-[0.05em]">
                    <Crown className="size-3" aria-hidden />Bingo
                  </span>
                ) : (
                  <StatusChip status={p.status} />
                )}
              </span>
              {mode !== 'shared' ? (
                <span className="mt-2 flex items-center gap-2">
                  <span className="block h-2 flex-1 overflow-hidden rounded border-[1.5px] border-ink bg-ink/[0.12]">
                    <span
                      className={`block h-full ${PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length]}`}
                      style={{ width: `${Math.round((p.solvedCount / Math.max(1, total)) * 100)}%` }}
                    />
                  </span>
                  <span className="whitespace-nowrap font-mono text-[11px] font-semibold text-card-muted">
                    {p.solvedCount}/{total}
                    {p.guesses > 0 ? ` · ${p.guesses} ${p.guesses === 1 ? 'try' : 'tries'}` : ''}
                  </span>
                </span>
              ) : null}
            </span>
            {miniOn ? (
              <MiniBoard
                size={boardSize}
                freeIndex={freeIndex}
                cells={p.solvedCells}
                colorIndex={p.colorIndex}
                hideLast={p.hideLastPick}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {mode === 'same' && waitingOn.length ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-card-muted">
          <Hourglass className="size-3.5 shrink-0" aria-hidden />
          Waiting on {joinNames(waitingOn)}
        </p>
      ) : null}
      {mode === 'same' && miniOn ? (
        <p className="mt-2 text-[12px] leading-snug text-card-muted">
          Striped square = this round&apos;s pick. It shows once everyone has played.
        </p>
      ) : null}
      {mode === 'shared' ? (
        <p className="mt-3 text-[13px] font-semibold leading-snug text-card-muted">
          Everyone must agree on a square (or all skip) before the next player.
        </p>
      ) : null}
    </div>
  )
}

/** Mobile: a strip of avatars with progress rings and a status badge. */
export function AvatarStrip({ players, total, className = '' }: { players: RoomPlayer[]; total: number; className?: string }) {
  return (
    <section
      aria-label="Players"
      className={`rounded-xl border-2 border-ink/90 bg-pitch-deep/75 px-2 pb-2 pt-2.5 ${className}`}
    >
      <ul className="flex justify-around gap-1 overflow-x-auto">
        {players.map((p) => {
          const pct = Math.round((p.solvedCount / Math.max(1, total)) * 100)
          const ring = RING_COLORS[p.colorIndex % RING_COLORS.length]
          const badge = p.bingo
            ? { cls: 'bg-yellow', icon: <Crown className="size-2.5" aria-hidden /> }
            : p.status?.kind === 'placed'
              ? { cls: 'bg-green-go', icon: <Check className="size-2.5" strokeWidth={3} aria-hidden /> }
              : p.status?.kind === 'missed'
                ? { cls: 'bg-coral', icon: <X className="size-2.5" strokeWidth={3} aria-hidden /> }
                : p.status?.kind === 'skipped'
                  ? { cls: 'bg-surface-2', icon: <SkipForward className="size-2.5" aria-hidden /> }
                  : p.status?.kind === 'playing'
                    ? { cls: 'bg-surface', icon: <Hourglass className="size-2.5" aria-hidden /> }
                    : null
          return (
            <li key={p.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <span
                className="relative flex size-[50px] items-center justify-center rounded-full"
                style={{ background: `conic-gradient(${ring} ${pct}%, rgba(245,240,225,0.18) 0)` }}
              >
                <Roundel player={p} size={40} />
                {badge ? (
                  <span
                    className={`absolute -bottom-[3px] -right-[3px] flex size-5 items-center justify-center rounded-full border-2 border-ink text-ink ${badge.cls}`}
                  >
                    {badge.icon}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate font-display text-[13px] font-extrabold uppercase leading-none text-on-green">
                {p.isSelf ? 'You' : p.name}
              </span>
              <span className="font-mono text-[10px] font-semibold text-[#cfe3d5]">
                {p.solvedCount}/{total}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Full-time banner: winner, how, and final standings. */
export function FullTimeBanner({
  players,
  total,
  isHost,
  starting,
  onRematch,
  modeLabel,
}: {
  players: RoomPlayer[]
  total: number
  isHost: boolean
  starting: boolean
  onRematch: () => void
  modeLabel: string
}) {
  const standings = [...players].sort((a, b) => {
    if (a.bingo !== b.bingo) return a.bingo ? -1 : 1
    if (a.bingo && b.bingo) return (a.bingoAt ?? 0) - (b.bingoAt ?? 0)
    if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount
    return a.guesses - b.guesses
  })
  const winner = standings.find((p) => p.bingo) ?? null
  return (
    <section aria-label="Full time" className="scoreboard mb-6 overflow-hidden px-5 pb-5 pt-3 sm:px-8 sm:pb-7">
      <div className="scoreboard-bulbs mx-1 mb-4" aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        <span className="eyebrow text-[12px]">Full time</span>
        <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#9fc2ac]">{modeLabel}</span>
      </div>
      <h2 className="mt-3 font-display text-[56px] font-black uppercase leading-[0.86] text-on-green sm:text-[88px]">
        {winner ? (
          <>
            {winner.isSelf ? 'You' : winner.name} <span className="text-yellow">{winner.isSelf ? 'win it.' : 'wins it.'}</span>
          </>
        ) : (
          'Round finished.'
        )}
      </h2>
      {winner ? <p className="mt-3 text-[16px] text-[#cfe3d5]">First to a full line.</p> : null}

      <ol className="mt-5 overflow-hidden rounded-lg border-2 border-[#052012] bg-surface text-ink">
        {standings.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 border-b-[1.5px] border-dashed border-ink/20 px-3.5 py-2.5 last:border-b-0 sm:gap-4 sm:px-5 ${
              p.bingo && i === 0 ? 'bg-[#fff3b8]' : ''
            }`}
          >
            <span className="w-6 font-display text-[26px] font-black leading-none text-ink">{i + 1}</span>
            <Roundel player={p} size={36} />
            <span className="min-w-0 flex-1 truncate font-display text-[22px] font-black uppercase leading-none">
              {p.isSelf ? `${p.name} (you)` : p.name}
            </span>
            {p.bingo ? <span className="eyebrow eyebrow-yellow -rotate-2">Bingo</span> : null}
            <span className="w-14 text-right font-mono text-[14px] font-semibold">{p.solvedCount}/{total}</span>
            <span className="hidden w-16 text-right font-mono text-[12px] text-card-muted sm:inline">
              {p.guesses} {p.guesses === 1 ? 'try' : 'tries'}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        {isHost ? (
          <button type="button" disabled={starting} onClick={onRematch} className="btn btn-primary btn-lg">
            {starting ? 'Starting…' : 'Rematch'}
          </button>
        ) : (
          <span className="flex items-center gap-2 text-[14px] font-semibold text-[#cfe3d5]">
            <Hourglass className="size-4" aria-hidden /> Waiting for the gaffer to call a rematch
          </span>
        )}
        <Link href="/play/setup?mode=multiplayer" className="btn btn-outline-light btn-lg">
          New room
        </Link>
        <Link href="/" className="btn btn-outline-light btn-lg">
          Home
        </Link>
      </div>
    </section>
  )
}

export function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

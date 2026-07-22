'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { type TenableQuestion, tenableTarget } from '@/data/tenable'

interface Props {
  question: TenableQuestion
  foundRanks: number[]
  /** When the round is over, reveal what was missed. */
  revealMissed?: boolean
  /** The most recently found rank — briefly highlighted. */
  justFound?: number | null
}

function Slot({
  badge,
  name,
  detail,
  image,
  state,
  highlight,
}: {
  badge: string
  name?: string
  detail?: string
  image?: string
  state: 'found' | 'missed' | 'empty'
  highlight?: boolean
}) {
  const reveal = state !== 'empty'
  return (
    <div
      className={`flex items-center gap-3 rounded-[14px] border-2 px-3 py-2.5 transition-colors ${
        state === 'found'
          ? 'border-green bg-white'
          : state === 'missed'
            ? 'border-red/40 bg-white/70'
            : 'border-ink/15 bg-white/45'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-lg font-black leading-none ${
          state === 'found' ? 'bg-green-go text-white' : state === 'missed' ? 'bg-red/70 text-white' : 'bg-card-tint text-muted'
        }`}
      >
        {badge}
      </span>
      {reveal && image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={`h-9 w-9 shrink-0 rounded-full object-cover ${state === 'missed' ? 'opacity-50 grayscale' : ''}`}
          style={{ objectPosition: '50% 20%' }}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          {reveal ? (
            <motion.div key="r" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
              <p
                className={`truncate font-display text-[15px] font-black uppercase leading-tight ${
                  state === 'missed' ? 'text-red' : highlight ? 'text-green' : 'text-ink'
                }`}
              >
                {name}
              </p>
              {detail && <p className="truncate text-[11px] font-semibold text-muted">{detail}</p>}
            </motion.div>
          ) : (
            <span className="text-sm font-bold tracking-wide text-muted">— — —</span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function TenableBoard({ question, foundRanks, revealMissed, justFound }: Props) {
  const found = new Set(foundRanks)
  const isOpen = question.kind === 'open'
  const target = tenableTarget(question)
  const byRank = new Map(question.answers.map((a) => [a.rank, a]))

  if (isOpen) {
    // Ten fill-order slots. No canonical "missed" set — reveal a few extras instead.
    const notFound = question.answers.filter((a) => !found.has(a.rank))
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: target }, (_, i) => {
            const a = byRank.get(foundRanks[i])
            return (
              <Slot
                key={i}
                badge={a ? '✓' : String(i + 1)}
                name={a?.name}
                detail={a?.detail}
                image={a?.image}
                state={a ? 'found' : 'empty'}
                highlight={a?.rank === justFound}
              />
            )
          })}
        </div>
        {revealMissed && notFound.length > 0 && (
          <p className="text-center text-[13px] font-semibold text-on-green-soft">
            Others you could&apos;ve had: {notFound.slice(0, 8).map((a) => a.name).join(', ')}
            {notFound.length > 8 ? `, +${notFound.length - 8} more` : ''}
          </p>
        )}
      </div>
    )
  }

  // Ranked: fixed slots by rank; reveal missed on round-over.
  const answers = [...question.answers].sort((a, b) => a.rank - b.rank)
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {answers.map((a) => {
        const isFound = found.has(a.rank)
        return (
          <Slot
            key={a.rank}
            badge={question.ordered ? String(a.rank) : '•'}
            name={isFound || revealMissed ? a.name : undefined}
            detail={isFound || revealMissed ? a.detail : undefined}
            image={a.image}
            state={isFound ? 'found' : revealMissed ? 'missed' : 'empty'}
            highlight={a.rank === justFound}
          />
        )
      })}
    </div>
  )
}

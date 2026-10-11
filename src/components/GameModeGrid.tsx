'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { GAME_MODES, type GameModeId } from '@/lib/gameModes'

const CARD_COPY: Record<GameModeId, string> = {
  bingo: 'Match drawn players to your board. First to a full line wins.',
  trivia: 'Quick-fire football questions. The fastest correct answer wins.',
  tenable: 'Ten answers, limited lives. Complete the list before you run out.',
  famous11s: 'Rebuild iconic starting XIs, from World Cup finals to club classics.',
  careers: 'Follow the clubs and years. Name the footballer, loans included.',
}

export function GameModeGrid() {
  return (
    <div className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-4 md:mt-10 lg:grid-cols-6">
      {GAME_MODES.map((m, i) => (
        <ModeCard
          key={m.id}
          title={m.title}
          blurb={CARD_COPY[m.id]}
          soloHref={m.soloHref}
          multiHref={m.multiHref}
          className={
            i === GAME_MODES.length - 1
              ? 'sm:col-start-2 lg:col-start-4'
              : i === GAME_MODES.length - 2
                ? 'lg:col-start-2'
                : ''
          }
          isNew={m.isNew}
        />
      ))}
    </div>
  )
}

function ModeCard({
  title,
  blurb,
  soloHref,
  multiHref,
  className,
  isNew,
}: {
  title: string
  blurb: string
  soloHref: string
  multiHref?: string
  className: string
  isNew?: boolean
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      aria-label={title}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex min-w-0 flex-col rounded-[14px] bg-surface p-6 shadow-[0_6px_0_#0a2417] sm:col-span-2 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[36px] font-black uppercase leading-none text-card-ink">
          {title}
        </h3>
        {isNew && (
          <span className="shrink-0 rounded bg-yellow px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
            New
          </span>
        )}
      </div>
      <p className="mb-6 mt-3 text-[15px] font-semibold leading-relaxed text-card-muted">{blurb}</p>
      <div className="mt-auto grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-2.5">
        {multiHref ? (
          <>
            <Link href={multiHref} aria-label={`Play ${title} multiplayer`} className="btn btn-primary min-h-11 px-2 text-xs tracking-[0.04em]">
              Multiplayer
            </Link>
            <Link href={soloHref} aria-label={`Play ${title} solo`} className="btn btn-outline min-h-11 px-2 text-xs tracking-[0.04em]">
              Solo
            </Link>
          </>
        ) : (
          <Link href={soloHref} aria-label={`Play ${title} solo`} className="btn btn-primary col-span-2 min-h-11">
            Play solo
          </Link>
        )}
      </div>
    </motion.article>
  )
}

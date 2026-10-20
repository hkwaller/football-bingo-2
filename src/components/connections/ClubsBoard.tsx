'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { yearsLabel } from '@/components/careers/CareerCard'
import type {
  ConnectionsAnswer,
  ConnectionsClub,
  ConnectionsPuzzle,
  ConnectionsStint,
} from '@/lib/connections/types'

/** "Manchester United" → "MU", "PSG" → "PSG" */
function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\d\s]/gu, '').split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

function Crest({ club, size }: { club: ConnectionsClub; size: number }) {
  if (club.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={club.logo}
        alt=""
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full border-[2.5px] border-card-ink bg-surface-2 font-display font-black leading-none text-card-ink"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {monogram(club.name)}
    </span>
  )
}

/** The clubs to connect, side by side with a "+" between them. */
export function ClubsBoard({ clubs }: { clubs: ConnectionsClub[] }) {
  const three = clubs.length >= 3
  return (
    <div
      className="flex items-stretch justify-center gap-2 md:gap-3"
      aria-label={`Played for ${clubs.map((c) => c.name).join(' and ')}`}
    >
      {clubs.map((club, i) => (
        <Fragment key={club.id}>
          {i > 0 && (
            <span
              aria-hidden
              className="flex shrink-0 items-center font-display text-[28px] font-black leading-none text-yellow md:text-[36px]"
            >
              +
            </span>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.2 : -1.2 }}
            transition={{ duration: 0.25, delay: i * 0.08 }}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-[14px] border-[2.5px] border-card-ink bg-surface px-2 py-5 text-center shadow-[0_6px_0_#0a2417] md:px-4 md:py-7"
          >
            <Crest club={club} size={three ? 52 : 72} />
            <span
              className={`w-full break-words font-display font-black uppercase leading-[0.95] text-card-ink ${
                three ? 'text-[17px] md:text-[24px]' : 'text-[22px] md:text-[30px]'
              }`}
            >
              {club.name}
            </span>
          </motion.div>
        </Fragment>
      ))}
    </div>
  )
}

function stintLabel(s: ConnectionsStint, clubs: ConnectionsClub[]): string {
  const club = clubs.find((c) => c.id === s.clubId)?.name ?? ''
  const years = s.from != null ? ` ${yearsLabel({ from: s.from, to: s.to ?? null })}` : ''
  return `${club}${years}${s.loan ? ' (loan)' : ''}`
}

/**
 * Who else fits, most famous first. Highlighted ids (the answers given) are
 * always shown, even past the limit.
 */
export function AnswerList({
  puzzle,
  highlight = {},
  limit = 6,
}: {
  puzzle: ConnectionsPuzzle
  /** answerId → label, e.g. "You" or the names of who gave it. */
  highlight?: Record<string, string>
  limit?: number
}) {
  const shown = puzzle.answers.filter((a, i) => i < limit || highlight[a.id])
  const hidden = puzzle.answers.length - shown.length
  return (
    <div className="rounded-[14px] bg-surface px-4 py-3 shadow-[0_6px_0_#0a2417] md:px-5">
      <p className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-card-muted">
        {puzzle.answers.length === 1
          ? 'The only one in our book'
          : `${puzzle.answers.length} in our book`}
      </p>
      <ul className="divide-y divide-dotted divide-card-ink/15">
        {shown.map((a: ConnectionsAnswer) => (
          <li key={a.id} className="flex items-center gap-3 py-2">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.imageUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border-2 border-card-ink object-cover"
                style={{ objectPosition: '50% 20%' }}
              />
            ) : (
              <span className="h-9 w-9 shrink-0 rounded-full border-2 border-card-ink/30 bg-surface-2" />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 font-display text-[19px] font-black uppercase leading-tight text-card-ink">
                {a.name}
                {highlight[a.id] && (
                  <span className="rounded bg-yellow px-1.5 py-0.5 font-mono text-[10px] font-bold normal-case tracking-[0.04em] text-ink">
                    {highlight[a.id]}
                  </span>
                )}
              </p>
              <p className="font-mono text-[11.5px] font-semibold leading-snug text-card-muted">
                {a.stints.map((s) => stintLabel(s, puzzle.clubs)).join(' · ')}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="pt-1 text-[12px] font-semibold text-card-muted-2">+ {hidden} more</p>
      )}
    </div>
  )
}

/** "both" / "all three" for the prompt line. */
export function clubsPhrase(count: number): string {
  return count >= 3 ? 'all three' : 'both'
}

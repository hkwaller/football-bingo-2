'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { GAME_MODES } from '@/lib/gameModes'

const ROTATIONS = [-0.6, 0.6, -0.4, 0.5]

export function GameModeGrid() {
  return (
    <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {GAME_MODES.map((m, i) => (
        <ModeCard
          key={m.id}
          title={m.title}
          blurb={m.blurb}
          soloHref={m.soloHref}
          multiHref={m.multiHref}
          rot={ROTATIONS[i % ROTATIONS.length]}
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
  rot,
  isNew,
}: {
  title: string
  blurb: string
  soloHref: string
  multiHref: string
  rot: number
  isNew?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative flex flex-col rounded-[14px] bg-surface p-7 shadow-[0_10px_0_#0a2417]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      {isNew && (
        <span className="absolute right-4 top-4 rounded-full bg-yellow px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ink">
          New
        </span>
      )}
      <p className="font-display text-[34px] font-black uppercase leading-none text-card-ink">
        {title}
      </p>
      <p className="mt-2 text-[14.5px] font-semibold leading-relaxed text-card-muted">{blurb}</p>
      <div className="mt-auto flex flex-col gap-3 pt-[18px]">
        <Link href={multiHref} className="btn btn-primary">
          Multiplayer
        </Link>
        <Link href={soloHref} className="btn btn-outline">
          Solo
        </Link>
      </div>
    </motion.div>
  )
}

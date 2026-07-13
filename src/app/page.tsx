'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sticker } from '@/components/Sticker'

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-14 md:px-9 md:py-16">
      {/* Hero */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative text-center"
      >
        <motion.div
          initial={{ opacity: 0, rotate: -14, y: 10 }}
          animate={{ opacity: 1, rotate: -7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="pointer-events-none absolute -left-24 -top-2 hidden md:block lg:-left-40"
        >
          <Sticker name="Messi" width={84} nameSize={9.5} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, rotate: 12, y: 10 }}
          animate={{ opacity: 1, rotate: 6, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
          className="pointer-events-none absolute -right-24 top-4 hidden md:block lg:-right-40"
        >
          <Sticker name="Haaland" width={84} nameSize={9.5} />
        </motion.div>

        <h1 className="font-display text-[clamp(3.5rem,13vw,84px)] uppercase leading-[0.95] text-green">
          Football
          <br />
          <span className="text-red">Bingo</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[460px] text-[15px] font-medium leading-relaxed text-muted">
          Match drawn players to squares and race to a full line. Football knowledge is your only
          tactic.
        </p>
      </motion.div>

      {/* Mode cards */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
        className="grid w-full max-w-[720px] gap-5 sm:grid-cols-2"
      >
        <ModeCard
          title="Bingo"
          blurb="Fill your board with the players drawn."
          soloHref="/play/setup"
          multiHref="/room/new"
        />
        <ModeCard
          title="Trivia"
          blurb="Quick-fire questions, first to the whistle wins."
          soloHref="/trivia/setup?mode=solo"
          multiHref="/trivia/setup?mode=multiplayer"
        />
      </motion.div>
    </div>
  )
}

function ModeCard({
  title,
  blurb,
  soloHref,
  multiHref,
}: {
  title: string
  blurb: string
  soloHref: string
  multiHref: string
}) {
  return (
    <div className="panel flex flex-col gap-1.5 p-6">
      <p className="font-display text-[28px] uppercase leading-none text-green">{title}</p>
      <p className="text-[13.5px] font-medium text-muted">{blurb}</p>
      <div className="mt-3.5 flex gap-2.5">
        <Link href={soloHref} className="btn btn-primary flex-1">
          Solo
        </Link>
        <Link href={multiHref} className="btn btn-outline flex-1">
          Multiplayer
        </Link>
      </div>
    </div>
  )
}

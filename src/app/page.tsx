'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255, 61, 154, 0.2), transparent), radial-gradient(ellipse 50% 40% at 90% 40%, rgba(212, 255, 0, 0.12), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center md:py-28">
        <motion.p
          className="font-display text-sm font-bold uppercase tracking-[0.35em] text-[var(--fb-accent-lime)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Matchday energy
        </motion.p>
        <motion.h1
          className="font-display mt-4 text-6xl font-bold leading-[0.92] tracking-tight text-chalk sm:text-7xl md:text-8xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[var(--fb-accent-lime)]">FOOTBALL</span>
          <br />
          BINGO
        </motion.h1>
        <motion.p
          className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-chalk/70 md:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          Draft random players onto your board, or use free mode to pick a square
          and search. Nationalities, clubs, and achievements — solo or race online.
        </motion.p>
        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Link
            href="/play/setup"
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-[var(--fb-accent-lime)] px-10 py-4 text-lg font-bold text-black shadow-lg shadow-lime-900/25 transition hover:brightness-105"
          >
            Play solo
          </Link>
          <Link
            href="/room/new"
            className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border-2 border-[var(--fb-accent-magenta)] bg-[var(--fb-accent-magenta)]/15 px-10 py-4 text-lg font-bold text-chalk backdrop-blur transition hover:bg-[var(--fb-accent-magenta)]/25"
          >
            Multiplayer room
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

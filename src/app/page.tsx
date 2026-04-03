'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 106, 79, 0.5), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(34, 197, 94, 0.12), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-2xl px-4 py-20 text-center">
        <motion.h1
          className="text-4xl font-bold tracking-tight text-chalk sm:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          Football Bingo
        </motion.h1>
        <motion.p
          className="mt-4 text-lg text-chalk/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          Draft random players onto your board, or use free mode to pick a square
          and search. Nationalities, clubs, and achievements — solo or race online.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Link
            href="/play"
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
          >
            Play solo
          </Link>
          <Link
            href="/room/new"
            className="inline-flex min-w-[200px] items-center justify-center rounded-xl border border-white/25 bg-white/5 px-8 py-3.5 text-base font-semibold text-chalk backdrop-blur transition hover:bg-white/10"
          >
            Multiplayer room
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

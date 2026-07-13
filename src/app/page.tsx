"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-[calc(100vh-73px)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Pitch markings: center circle + halfway line, chalk on turf */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
        width="1400"
        height="1400"
        viewBox="0 0 1400 1400"
        fill="none"
      >
        <circle cx="700" cy="700" r="340" stroke="#e9f2ec" strokeWidth="3" />
        <circle cx="700" cy="700" r="10" fill="#e9f2ec" />
        <line x1="-200" y1="700" x2="1600" y2="700" stroke="#e9f2ec" strokeWidth="3" />
      </svg>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="chip"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-turf shadow-glow-turf" />
          Matchday is live
        </motion.div>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.06, ease: "easeOut" }}
          className="font-display mt-6 text-[clamp(4.5rem,14vw,10rem)] font-bold uppercase leading-[0.86] tracking-tight text-chalk"
        >
          Football
          <br />
          <span className="text-turf drop-shadow-[0_0_28px_rgba(60,233,126,0.35)]">
            Bingo
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
          className="mt-6 max-w-md text-balance text-base leading-relaxed text-chalk-dim"
        >
          Draft players, match squares, and race your friends to a full line —
          football knowledge is your only tactic.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="mt-12 grid w-full gap-4 sm:grid-cols-2"
        >
          {/* Bingo */}
          <div className="card group relative overflow-hidden p-6 text-left transition-transform duration-200 hover:-translate-y-0.5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-turf/10 opacity-70 blur-2xl transition-opacity group-hover:opacity-100" />
            <p className="font-display text-3xl font-semibold uppercase tracking-wide text-chalk">
              Bingo
            </p>
            <p className="mt-1 text-sm text-chalk-dim">
              Fill your board with the players drawn.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Link href="/play/setup" className="btn btn-primary flex-1">
                Solo
              </Link>
              <Link href="/room/new" className="btn btn-secondary flex-1">
                Multiplayer
              </Link>
            </div>
          </div>

          {/* Trivia */}
          <div className="card group relative overflow-hidden p-6 text-left transition-transform duration-200 hover:-translate-y-0.5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/10 blur-2xl" />
            <p className="font-display text-3xl font-semibold uppercase tracking-wide text-chalk">
              Trivia
            </p>
            <p className="mt-1 text-sm text-chalk-dim">
              Quick-fire questions, first to the whistle wins.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Link
                href="/trivia/setup?mode=solo"
                className="btn btn-primary flex-1"
              >
                Solo
              </Link>
              <Link
                href="/trivia/setup?mode=multiplayer"
                className="btn btn-secondary flex-1"
              >
                Multiplayer
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

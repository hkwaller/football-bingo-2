"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="relative min-h-[85vh] overflow-hidden flex flex-col items-center justify-center">
      {/* Background Marquee element */}
      <div className="pointer-events-none absolute inset-y-0 flex w-max flex-col justify-between opacity-15 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-nowrap shrink-0 whitespace-nowrap overflow-hidden"
          >
            <span className="font-display text-[15vmax] leading-none tracking-tight text-[var(--fb-accent-magenta)] mr-8 animate-marquee">
              FOOTBALL BINGO • KICKOFF • DRAFT • PLAY •
            </span>
            <span
              className="font-display text-[15vmax] leading-none tracking-tight text-[var(--fb-accent-magenta)] mr-8 animate-marquee"
              aria-hidden="true"
            >
              FOOTBALL BINGO • KICKOFF • DRAFT • PLAY •
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 text-center">
        <motion.div
          className="inline-block border-4 border-white bg-black px-6 py-2 shadow-brutal-lime -rotate-2"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1, rotate: -2 }}
          transition={{ duration: 0.4, type: "spring" }}
        >
          <p className="font-mono text-lg font-bold uppercase tracking-[0.2em] text-[var(--fb-accent-lime)]">
            Matchday syntax
          </p>
        </motion.div>

        <motion.h1
          className="font-display mt-8 text-[12vw] font-black leading-[0.85] tracking-[0.05em] text-white drop-shadow-2xl md:text-[10vw]"
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ textShadow: "6px 6px 0px var(--fb-accent-magenta)" }}
        >
          <span
            className="text-[var(--fb-accent-lime)]"
            style={{ textShadow: "6px 6px 0px var(--fb-accent-cyan)" }}
          >
            FOOTBALL
          </span>
          <br />
          BINGO
        </motion.h1>

        <motion.p
          className="mx-auto mt-12 max-w-2xl bg-black border-2 border-white p-6 font-mono text-lg leading-relaxed text-chalk shadow-brutal font-bold"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          &gt; INITIALIZING DRAFT SEQUENCE... <br />
          &gt; SELECT PLAYERS.
          <br />
          &gt; MATCH SQUARES.
          <br />
          &gt; SURVIVE THE RACE.
        </motion.p>
        <motion.div
          className="mt-14 flex flex-col items-center justify-center gap-8 sm:flex-row"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Link
            href="/play/setup"
            className="fb-brutal-btn min-w-[240px] px-8 py-5 text-2xl -rotate-1"
          >
            Play solo
          </Link>
          <Link
            href="/room/new"
            className="fb-brutal-btn min-w-[240px] px-8 py-5 text-2xl rotate-1 bg-[var(--fb-accent-cyan)] !shadow-brutal-magenta"
          >
            Multiplayer
          </Link>
          <Link
            href="/trivia/setup"
            className="fb-brutal-btn min-w-[240px] px-8 py-5 text-2xl -rotate-1 bg-[var(--fb-accent-yellow)] !shadow-brutal-lime text-black"
          >
            Trivia
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BingoPreview,
  Famous11sPreview,
  TenablePreview,
  TriviaPreview,
} from '@/components/games/GamePreviews'
import { GAME_MODES, type GameModeId } from '@/lib/gameModes'
import { getGamesPreviewData } from '@/lib/gamesPreview'

export const metadata: Metadata = {
  title: 'Games',
  description:
    'Bingo, Trivia, Tenable and Famous 11s - pick a football knowledge game and play solo or against a full room.',
  alternates: { canonical: '/games' },
}

/** Mode colours from DESIGN.md; every one takes ink text. */
const ACCENT: Record<GameModeId, { bg: string; border: string }> = {
  bingo: { bg: 'bg-yellow', border: 'border-yellow' },
  trivia: { bg: 'bg-coral', border: 'border-coral' },
  tenable: { bg: 'bg-sky', border: 'border-sky' },
  famous11s: { bg: 'bg-green-go', border: 'border-green-go' },
}

export default function GamesPage() {
  const data = getGamesPreviewData()

  const previews: Record<GameModeId, ReactNode> = {
    bingo: data.bingo ? <BingoPreview data={data.bingo} /> : null,
    trivia: data.trivia.length ? <TriviaPreview questions={data.trivia} /> : null,
    tenable: data.tenable ? <TenablePreview data={data.tenable} /> : null,
    famous11s: data.famous11s ? <Famous11sPreview data={data.famous11s} /> : null,
  }

  return (
    <div className="relative w-full overflow-hidden pb-24">
      {/* decorative chalk center circle */}
      <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-surface/[0.18]" />

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="relative mx-auto max-w-5xl px-6 pt-12 text-center md:px-9">
        <span className="eyebrow">Pick your game</span>
        <h1 className="mt-4 font-display text-[clamp(2.75rem,8vw,80px)] font-black uppercase leading-[0.9] text-on-green">
          Four ways to play
        </h1>
        <p className="mx-auto mt-4 max-w-[480px] text-[15.5px] font-semibold leading-relaxed text-on-green-soft">
          Go solo to sharpen up, or open a room and send the link to your mates. Every game runs on
          the same real player data.
        </p>
        <nav aria-label="Jump to a game" className="mt-8 flex flex-wrap justify-center gap-2.5">
          {GAME_MODES.map((m) => (
            <a
              key={m.id}
              href={`#${m.id}`}
              className="inline-flex items-center gap-2 rounded-lg border-[2.5px] border-surface/40 px-4 py-2 font-display text-[17px] font-black uppercase leading-none text-on-green transition-colors hover:bg-surface/10"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${ACCENT[m.id].bg}`} />
              {m.title}
            </a>
          ))}
        </nav>
      </header>

      {/* ── One row per game ───────────────────────────────── */}
      <div className="relative mx-auto mt-16 flex max-w-6xl flex-col gap-24 px-6 md:mt-20 md:gap-32 md:px-9">
        {GAME_MODES.map((m, i) => {
          const flip = i % 2 === 1
          const accent = ACCENT[m.id]
          const number = String(i + 1).padStart(2, '0')
          return (
            <section
              key={m.id}
              id={m.id}
              aria-labelledby={`${m.id}-title`}
              className={`grid scroll-mt-8 items-center gap-10 lg:gap-16 ${flip ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'lg:grid-cols-[1.1fr_0.9fr]'}`}
            >
              {/* Preview frame */}
              <div className={flip ? 'lg:order-2' : ''}>
                <div
                  className="rounded-2xl border-[2.5px] border-ink bg-pitch-deep shadow-[0_10px_0_#0a2417]"
                  style={{ transform: `rotate(${flip ? 0.7 : -0.7}deg)` }}
                >
                  <div
                    className={`flex items-center justify-between rounded-t-[13px] border-b-[3px] bg-ink px-4 py-2.5 ${accent.border}`}
                  >
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-on-green-dim">
                      Mode {number} · {m.title}
                    </span>
                    <span className="inline-flex animate-pulse-soft items-center rounded bg-coral px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
                      In play
                    </span>
                  </div>
                  <div className="p-4 sm:p-6">{previews[m.id]}</div>
                </div>
              </div>

              {/* Pitch */}
              <div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block -rotate-[1.5deg] rounded px-2 py-1 font-mono text-[11.5px] font-semibold uppercase leading-none tracking-[0.1em] text-ink ${accent.bg}`}
                  >
                    {m.tagline}
                  </span>
                  {m.isNew && (
                    <span className="rounded bg-yellow px-2 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-ink">
                      New
                    </span>
                  )}
                </div>
                <h2
                  id={`${m.id}-title`}
                  className="mt-4 font-display text-[clamp(3rem,8vw,84px)] font-black uppercase leading-[0.86] text-on-green"
                >
                  {m.title}
                </h2>
                <p className="mt-4 max-w-[460px] text-[16px] font-semibold leading-relaxed text-on-green-soft">
                  {m.blurb}
                </p>

                <ol className="mt-7 flex flex-col gap-4">
                  {m.steps.map((s, si) => (
                    <li key={s.title} className="flex gap-3.5">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[17px] font-black leading-none text-ink shadow-[0_3px_0_#0a2417] ${accent.bg}`}
                      >
                        {si + 1}
                      </span>
                      <div>
                        <p className="font-display text-[20px] font-black uppercase leading-none text-on-green">
                          {s.title}
                        </p>
                        <p className="mt-1 text-[14px] font-semibold leading-relaxed text-on-green-dim">
                          {s.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {m.tags.map((t) => (
                    <li
                      key={t}
                      className="rounded-md bg-black/20 px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em] text-on-green"
                    >
                      {t}
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={m.multiHref} className="btn btn-primary btn-lg">
                    Multiplayer
                  </Link>
                  <Link href={m.soloHref} className="btn btn-outline-light btn-lg">
                    Solo
                  </Link>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

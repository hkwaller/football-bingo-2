import type { Metadata } from 'next'
import Link from 'next/link'
import { ScanToJoin } from '@/components/ScanToJoin'
import { Sticker } from '@/components/Sticker'
import { GAME_MODES, type GameMode, type GameModeId } from '@/lib/gameModes'
import { DECK } from '@/lib/stickerDeck'

/**
 * Home screen of the native app. The app opens `/`, and `proxy.ts` rewrites
 * that to this page when the user agent carries `FootballBingoApp` (see
 * capacitor.config.ts), so universal links and the logo still point at `/`.
 * No pitch: the visitor already installed the game, so the games come first.
 */
export const metadata: Metadata = {
  title: 'Play',
  robots: { index: false, follow: false },
}

/** Mode colours from DESIGN.md; every one takes ink text. */
const TILE: Record<GameModeId, string> = {
  bingo: 'bg-yellow',
  trivia: 'bg-coral',
  tenable: 'bg-sky',
  famous11s: 'bg-green-go',
  careers: 'bg-surface',
}

const byName = (name: string) => DECK.find((p) => p.name === name)

export default function AppHomePage() {
  const [bingo, ...rest] = GAME_MODES

  return (
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden px-4 pb-10 sm:px-6 md:px-9">
      {/* chalk centre circle peeking in from the top */}
      <div className="pointer-events-none absolute left-1/2 top-[-420px] h-[640px] w-[640px] -translate-x-1/2 rounded-full border-[3px] border-surface/[0.14]" />

      <header className="relative pt-2 sm:pt-6">
        <h1 className="font-display text-[clamp(44px,13vw,80px)] font-black uppercase leading-[0.86] text-on-green">
          Know football?{' '}
          <span className="mt-1 inline-block -rotate-[1.5deg] bg-yellow px-2.5 text-ink shadow-[0_5px_0_#0a2417]">
            Prove it.
          </span>
        </h1>
        <p className="mt-4 max-w-[34ch] text-[15px] font-semibold leading-snug text-on-green-soft">
          Pick a game. Play solo, or open a room and send the link to your mates.
        </p>
        <ScanToJoin className="mt-5 [&_.btn]:w-full sm:[&_.btn]:w-auto" />
      </header>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <FeaturedTile mode={bingo} />
        {rest.map((m) => (
          <ModeTile key={m.id} mode={m} />
        ))}
      </div>
    </div>
  )
}

/** Bingo is the signature mode, so it gets the wide tile and a couple of stickers. */
function FeaturedTile({ mode }: { mode: GameMode }) {
  const left = byName('Haaland')
  const right = byName('Messi')
  return (
    <section
      aria-labelledby={`${mode.id}-title`}
      className={`relative overflow-hidden rounded-2xl border-[2.5px] border-ink p-5 shadow-[0_6px_0_#0a2417] sm:col-span-2 sm:p-7 ${TILE[mode.id]}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-3 top-4 flex sm:right-6 sm:top-6"
      >
        {left && (
          <Sticker
            name={left.name}
            imageUrl={left.imageUrl}
            width={84}
            nameSize={11}
            rotate={-8}
            className="relative top-3 hidden min-[380px]:block sm:w-[112px]"
          />
        )}
        {right && (
          <Sticker
            name={right.name}
            imageUrl={right.imageUrl}
            width={92}
            nameSize={11}
            rotate={7}
            variant="pink"
            className="-ml-5 sm:w-[124px]"
          />
        )}
      </div>

      <p className="relative font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75">
        {mode.tagline}
      </p>
      <h2
        id={`${mode.id}-title`}
        className="relative mt-1.5 font-display text-[clamp(60px,19vw,104px)] font-black uppercase leading-[0.82] text-ink"
      >
        {mode.title}
      </h2>
      <p className="relative mt-3 max-w-[24ch] text-[14.5px] font-semibold leading-snug text-ink/80 sm:max-w-[40ch]">
        {mode.blurb}
      </p>
      <TileActions mode={mode} />
    </section>
  )
}

function ModeTile({ mode }: { mode: GameMode }) {
  return (
    <section
      aria-labelledby={`${mode.id}-title`}
      className={`relative flex flex-col rounded-2xl border-[2.5px] border-ink p-5 shadow-[0_6px_0_#0a2417] ${TILE[mode.id]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/75">
          {mode.tagline}
        </p>
        {mode.isNew && (
          <span className="-mt-0.5 rotate-3 rounded border-[1.5px] border-ink bg-yellow px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-ink">
            New
          </span>
        )}
      </div>
      <h2
        id={`${mode.id}-title`}
        className="mt-1.5 font-display text-[clamp(44px,13vw,60px)] font-black uppercase leading-[0.84] text-ink"
      >
        {mode.title}
      </h2>
      <p className="mt-2.5 text-[14px] font-semibold leading-snug text-ink/80">{mode.blurb}</p>
      <TileActions mode={mode} />
    </section>
  )
}

/** Room first (the social roar is the point), solo beside it. Ink buttons, since yellow vanishes on the Bingo tile. */
function TileActions({ mode }: { mode: GameMode }) {
  return (
    <div className="relative mt-auto grid grid-cols-2 gap-2.5 pt-5">
      {mode.multiHref ? (
        <Link
          href={mode.multiHref}
          className="btn border-[2.5px] border-ink bg-ink text-on-green shadow-[0_4px_0_rgba(10,36,23,0.35)] hover:-translate-y-0.5 active:translate-y-0.5"
        >
          Open a room
        </Link>
      ) : null}
      <Link
        href={mode.soloHref}
        className={`btn btn-outline ${mode.multiHref ? '' : 'col-span-2'}`}
      >
        Solo
      </Link>
    </div>
  )
}

import Link from 'next/link'
import { enrichedFootballPlayers } from '@/data/players'

export const metadata = {
  title: 'Photo credits — Football Bingo',
}

type Row = {
  players: string[]
  author: string
  license: string
  licenseUrl: string
  source: string
}

// One row per distinct source photo; list the players that use it.
function buildRows(): Row[] {
  const bySource = new Map<string, Row>()
  for (const p of enrichedFootballPlayers) {
    const a = p.imageAttribution
    if (!a) continue
    const key = a.source || `${a.author}|${a.license}`
    const row = bySource.get(key)
    if (row) row.players.push(p.name)
    else
      bySource.set(key, {
        players: [p.name],
        author: a.author,
        license: a.license,
        licenseUrl: a.licenseUrl,
        source: a.source,
      })
  }
  return [...bySource.values()].sort((a, b) => a.players[0].localeCompare(b.players[0]))
}

export default function CreditsPage() {
  const rows = buildRows()
  return (
    <main className="mx-auto max-w-[860px] px-6 py-10">
      <p className="eyebrow">Attribution</p>
      <h1 className="mt-1.5 font-display text-[34px] uppercase leading-none text-green">
        Photo credits
      </h1>
      <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-muted">
        Player photographs are sourced from{' '}
        <a
          href="https://commons.wikimedia.org"
          className="font-semibold text-ink underline"
          target="_blank"
          rel="noreferrer"
        >
          Wikimedia Commons
        </a>{' '}
        and used under their respective free licences. Each photo, its author and
        licence, and a link to the source file are listed below. {rows.length} photos
        credited.
      </p>

      <ul className="mt-6 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.source || r.author} className="py-3 text-[13px]">
            <div className="font-semibold text-ink">{r.players.join(', ')}</div>
            <div className="mt-0.5 text-muted">
              © {r.author} ·{' '}
              {r.licenseUrl ? (
                <a href={r.licenseUrl} className="underline" target="_blank" rel="noreferrer">
                  {r.license}
                </a>
              ) : (
                r.license
              )}
              {r.source ? (
                <>
                  {' · '}
                  <a href={r.source} className="underline" target="_blank" rel="noreferrer">
                    source
                  </a>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <Link href="/" className="btn btn-outline btn-sm">
          ← Back
        </Link>
      </div>
    </main>
  )
}

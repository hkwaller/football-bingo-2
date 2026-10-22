import Link from 'next/link'
import { getPhotoCredits } from '@/lib/photoCredits'
import { publicPageMetadata } from '@/lib/seo'

export const metadata = publicPageMetadata(
  'Photo and data credits',
  'Photo authors, licences and additional portrait sources across Football Bingo, plus the sources behind its football facts, career paths and lineups.',
  '/credits',
)

export default function CreditsPage() {
  const rows = getPhotoCredits()
  const credited = rows.filter((row) => row.attribution)
  const additional = rows.filter((row) => !row.attribution)
  return (
    <div className="mx-auto max-w-[860px] px-6 py-10">
      <span className="eyebrow">Attribution</span>
      <h1 className="mt-2.5 font-display text-[34px] font-black uppercase leading-none text-on-green">
        Photo and data credits
      </h1>
      <section aria-labelledby="data-sources" className="mt-6 text-[14px] leading-relaxed text-on-green-soft">
        <h2 id="data-sources" className="font-display text-2xl font-black uppercase text-on-green">Football data</h2>
        <p className="mt-3">
          Player profiles, club histories and career paths are derived from{' '}
          <a href="https://www.transfermarkt.com/" className="text-yellow underline" target="_blank" rel="noreferrer">Transfermarkt</a>.
          {' '}Tenable lists and Famous 11s lineups are curated, with{' '}
          <a href="https://en.wikipedia.org/" className="text-yellow underline" target="_blank" rel="noreferrer">Wikipedia</a>
          {' '}lists and match reports among their references. Connections combines the player and career banks to find shared clubs, including loans.
        </p>
        <p className="mt-3">
          These are game datasets, not live statistics or complete football records. Rankings and
          careers can change, and some eligible real-world answers may be missing. Club names,
          crests and third-party content remain subject to their owners&apos; rights.
        </p>
      </section>

      <section aria-labelledby="photo-credits" className="mt-8">
        <h2 id="photo-credits" className="font-display text-2xl font-black uppercase text-on-green">Photo credits</h2>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-on-green-soft">
          Many player photographs come from{' '}
          <a href="https://commons.wikimedia.org" className="font-semibold text-yellow underline" target="_blank" rel="noreferrer">Wikimedia Commons</a>.
          {' '}The {credited.length} photographs below have recorded author and licence details.
          Additional portraits used in individual modes are listed separately.
        </p>
        <ul className="mt-6 divide-y divide-surface/15">
          {credited.map((row) => {
            const a = row.attribution!
            return (
              <li key={a.source || row.imageUrl} className="py-3 text-[13px]">
                <div className="font-semibold text-on-green">{row.names.join(', ')}</div>
                <div className="mt-0.5 text-on-green-dim">
                  {a.author} ·{' '}
                  {a.licenseUrl ? (
                    <a href={a.licenseUrl} className="underline" target="_blank" rel="noreferrer">{a.license}</a>
                  ) : a.license}
                  {' · '}
                  <a href={a.source || row.imageUrl} className="underline" target="_blank" rel="noreferrer">source</a>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {additional.length > 0 && (
        <section aria-labelledby="additional-portraits" className="mt-8">
          <h2 id="additional-portraits" className="font-display text-2xl font-black uppercase text-on-green">Additional portrait sources</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-on-green-soft">
            These {additional.length} portraits include mode-specific images from Transfermarkt and
            Wikimedia. Author and licence details are not recorded for these images. Source links
            identify the images; they do not grant permission to reuse them.
          </p>
          <ul className="mt-4 divide-y divide-surface/15">
            {additional.map((row) => (
              <li key={row.imageUrl} className="py-3 text-[13px]">
                <span className="font-semibold text-on-green">{row.names.join(', ')}</span>
                {' · '}
                <a href={row.imageUrl} className="text-on-green-dim underline" target="_blank" rel="noreferrer">
                  Image source ({new URL(row.imageUrl).hostname})
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <Link href="/games" className="btn btn-outline-light btn-sm">Explore the games</Link>
      </div>
    </div>
  )
}

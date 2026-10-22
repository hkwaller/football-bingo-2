import { publicPageMetadata } from '@/lib/seo'
import { PublicLegal } from '@/lib/PublicLegal'
export const metadata = publicPageMetadata(
  'Terms of use',
  'Terms for playing Football Bingo, using optional accounts and paid features, and contacting Playam for help.',
  '/terms',
)
export default function Page() {
  return (
    <PublicLegal title="Terms of use">
      <p>Last updated: 11 October 2026.</p>
      <p>
        Football Bingo is a game from Playam, operated by Amalies Utviklingsfabrikk in Oslo, Norway.
      </p>
      <h2>Playing the game</h2>
      <p>
        Guest play does not require an account. Use the game fairly: do not disrupt rooms,
        impersonate others, abuse other players, automate cheating or attempt to access information
        you are not entitled to see. Room names and messages may be visible to other participants.
      </p>
      <h2>Accounts and paid features</h2>
      <p>
        You are responsible for your account and any content you submit. If you choose an optional
        paid feature, its price, duration and cancellation arrangements are shown before purchase.
        Contact us for help with an account or purchase.
      </p>
      <h2>Game content and availability</h2>
      <p>
        Game content is for entertainment and may contain errors. We may update content or features
        and interrupt access for maintenance or to address abuse. Third-party content remains
        subject to its owners&apos; rights. These terms do not limit rights you have under applicable
        consumer law.
      </p>
      <h2>Privacy and contact</h2>
      <p>
        Read the <a href="/privacy">game privacy policy</a> and{' '}
        <a href="https://playam.app/privacy">Playam platform policy</a>. Questions:{' '}
        <a href="mailto:info@amaliesutviklingsfabrikk.no">info@amaliesutviklingsfabrikk.no</a>.
      </p>
    </PublicLegal>
  )
}

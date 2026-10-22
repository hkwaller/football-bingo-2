import { publicPageMetadata } from '@/lib/seo'
import { PublicLegal, WebAdvertisingPrivacy } from '@/lib/PublicLegal'
export const metadata = publicPageMetadata(
  'Privacy policy',
  'How Football Bingo handles guest play, optional accounts, saved results and usage analytics. Contact Playam about your data.',
  '/privacy',
)
export default function Page() {
  return (
    <PublicLegal title="Privacy policy">
      <p>Last updated: 11 October 2026.</p>
      <p>
        Football Bingo is operated by Amalies Utviklingsfabrikk / Playam in Oslo, Norway. You can
        play as a guest without creating an account.
      </p>
      <section>
        <h2>Information and services</h2>
        <p>
          Game rooms share player names, answers and scores through Liveblocks so everyone can play
          together. Clerk provides optional sign-in; an account may include your name, email address
          and account identifier. Supabase stores game data where saved results or game content are
          provided. The browser may store guest identity, preferences and progress locally.
        </p>
        <p>
          PostHog provides usage analytics through an EU endpoint to help us understand use and
          improve the game. Vercel hosts the website and processes technical request information to
          deliver and secure it. If you use a paid feature, payment processing is handled by Stripe;
          the payment screen describes that feature.
        </p>
      </section>
      <section>
        <h2>Your choices and contact</h2>
        <p>
          You can clear local game information through your browser settings. Contact us to request
          access, correction or deletion of personal information or ask about other applicable
          rights. Email{' '}
          <a href="mailto:info@amaliesutviklingsfabrikk.no">info@amaliesutviklingsfabrikk.no</a>.
          You can also raise a privacy concern with{' '}
          <a href="https://www.datatilsynet.no/">Datatilsynet</a>.
        </p>
      </section>
      <WebAdvertisingPrivacy />
    </PublicLegal>
  )
}

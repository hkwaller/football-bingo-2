# Football Bingo: public content and indexing

Date: 22 October 2026. Scope approved in chat after a repository and production review.

## Design

Keep the existing game, visual identity and five public sitemap URLs: `/`, `/games`,
`/credits`, `/privacy`, `/terms`. The source of mode copy remains `src/lib/gameModes.ts`.
It currently describes six modes: Bingo, Trivia, Tenable, Famous 11s, Careers and Connections.

Use `/games` as the single public mode guide, adding concrete examples and explaining
solo play, room hosting and each multiplayer mechanic. Do not create additional landing
pages or language variants without distinct content and demand.

Private route-family layouts apply `noindex` to setup, runtime, room, authentication and
account pages. Allow crawlers to fetch these page routes so they can see the directive;
keep APIs and the analytics proxy disallowed. Authentication and data authorization remain
unchanged. Robots directives do not provide access control.

Public metadata uses a shared helper to keep canonical URLs, Open Graph and Twitter copy
consistent. Preserve the existing generated social-image design and update its mode list.
The existing WebSite structured data receives the corrected shared description; no new
schema or AI-only files are introduced.

Credits enumerate resolved images from the player, career, Tenable and Famous 11s banks.
Connections uses the same player/career images. Match licence records by image URL,
never by player name alone, and distinguish uncredited image URLs from licensed photos.
Document the actual football-data sources and the datasets' limits.

## Alternatives considered

- Adding a landing page per mode increases maintenance and indexed routing without evidence
  of separate demand. Keep the existing guide instead.
- Blocking all private pages in robots.txt prevents search engines from reading noindex.
  Use explicit metadata on crawlable page routes instead; maintain API exclusions.
- Reusing a player's main photo licence for a different mode portrait is inaccurate.
  Inventory the resolved images and retain attribution gaps explicitly.

## Verification

Run the production build, TypeScript, ESLint, existing tests and category verification.
Use `npm run verify:seo -- http://127.0.0.1:3107` against the production build for HTTP
checks of canonicals, social metadata, sitemap membership, private-page noindex, raw guide
HTML with four bot user agents, credits and the generated PNG dimensions. Check rendered
guide navigation and solo setup entry in a browser.

## Separate work and limits

No deployment, authentication configuration/migration, payment or hosting change is included.
Playam showcase/articles require their own repository update. Search Console and repeated
AI-answer samples in English and Norwegian remain follow-ups, not demonstrated outcomes.

Production review before implementation confirmed Clerk development configuration. Account
continuity review must include Supabase Clerk-ID references, Stripe customer/subscription
metadata and entitlement metadata, webhooks, provider identities and native-app host rules.
Do not switch Clerk instances without an inventory, migration/rollback plan and flow checks.

The initial portrait inventory found 944 source-grouped photos with recorded attribution
and 1,229 additional image URLs without per-image author/licence records. Listing a source
does not resolve that attribution gap or establish permission to reuse an image.

## Implementation verification results

- `npm run build`: passed on Next.js 16.3.6, including its TypeScript check.
- `tsc --noEmit --incremental false`: passed after the development server refreshed
  its generated route types; the earlier stale dev/build route-type conflict is resolved.
- ESLint: zero errors, 58 existing warnings. Escaped two existing JSX apostrophes in
  the terms/privacy components so the repository-wide check succeeds.
- Existing tests: 41 passed via `node --import tsx --test 'src/**/*.test.ts'`.
  The npm script's tsx CLI could not create its IPC pipe under the sandbox, so the
  equivalent Node loader command was used.
- Category verification: passed; existing thin-country and untracked-club warnings remain.
- HTTP SEO regression checks: passed against the local production build, including five
  public canonicals/social URLs, the exact five sitemap entries, English language metadata,
  absent invented language alternatives, four bot user agents, private-route noindex and
  the 1200 × 630 PNG. The checks caught and prompted a fix for child metadata dropping
  the inherited social image.
- Browser: the Connections guide anchor navigates correctly; its solo link opens setup,
  and Kick off loads a guest puzzle. No console errors were recorded for this flow.
- Visual checks: the desktop guide and the final generated social image were inspected.
  The image was adjusted to fit the brand, headline and all six mode names without wrapping.

The local `.env.local` configures the canonical origin as `http://localhost:3000`. To
reproduce this run without changing environment files:

```sh
npm run start -- --hostname localhost --port 3107
npm run verify:seo -- http://localhost:3107 http://localhost:3000
```

For a deployment, run the same verification command against its URL with the expected
canonical origin (defaults to `https://bingo.playam.app`). These local results do not
verify deployment of the changes. No deployment or authentication migration was performed.

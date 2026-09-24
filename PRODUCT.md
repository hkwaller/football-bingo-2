# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary player is a football fan of broad, casual-to-committed knowledge - not a narrow stat-nerd niche. Two situations matter most:

- **Mates in a group** - football-mad friends playing together in a live room (matchday, pub, group chat), competing head to head for the roar of getting it right first.
- **Solo fans in idle moments** - an individual testing themselves on the couch or commute, chasing a personal best.

The product is deliberately kept accessible to a broad audience rather than tuned only for hardcore stat-heads.

## Product Purpose

Football Bingo is a football-knowledge game that lets fans prove what they know - alone or against friends in real time. Success is a fan who feels their knowledge was genuinely tested and rewarded, and who wants to pull others into a room to do it again.

## Positioning

Two claims a generic football quiz could not truthfully copy:

- **Skill, not luck.** Outcomes are earned by football knowledge, not chance - the guiding promise ("No luck, just football knowledge").
- **The live multiplayer roar.** The social, broadcast energy of a room reacting together in real time is the point, not a bolted-on mode.

## Operating Context

- Played in a browser, solo or in shared real-time rooms (Liveblocks), often on mobile and often socially (matchday, group chat, pub).
- A guest can start playing instantly; signing in is optional upside, not a gate.
- Rooms are joinable/shareable (QR + room IDs), reinforcing the group-play situation.

## Capabilities and Constraints

- **Three game modes**, each playable solo or multiplayer:
  - **Bingo** - the signature mode: build a grid of clubs, nations and honours; real players are drawn one by one; place each on a square he genuinely fits; first to a line (row/column/diagonal) wins.
  - **Trivia** - quick-fire football questions; fastest correct answer wins the round.
  - **Tenable** - name the ten (top scorers, most caps, biggest transfers, etc.) before your lives run out.
- Built on Next.js (App Router) + React 19; real-time via Liveblocks; auth via Clerk; payments via Stripe; data/enrichment backed by Supabase.
- Player dataset is a curated set of real footballers (~641) with category metadata (club / nation / honour). Tenable answers are curated and enriched via a Kaggle-CSV pipeline (not sourced live from the transfermarkt-api).
- Guest-first: core play must not require an account.

## Brand Commitments

- **Name:** "Football Bingo" (committed).
- **Voice:** confident, playful, broadcast-energy - game-show announcer, not textbook. Loud and celebratory ("Prove it.", "Race to a line", "BINGO").
- **Signature motif:** real players rendered as collectible **stickers** (album metaphor), carried across the whole product.

## Evidence on Hand

- Real, free-licensed player portraits (Wikimedia Commons), always credited on `/credits` - a legal commitment future work must preserve.
- Curated player dataset with club/nation/honour categories and club logos.
- Monetization is live and real: free-to-play with Adsterra ads, plus a Stripe "remove ads" subscription (`/go-ad-free`). No fabricated pricing, user counts, or testimonials exist - do not invent any.

## Product Principles

1. **Reward knowledge, never luck** - every mechanic should make a fan feel their football knowledge decided the outcome.
2. **Instant to start, social to stay** - a guest plays in seconds; the room is what makes them come back.
3. **Broadly accessible, not dumbed down** - welcoming to casual fans while still satisfying for committed ones.
4. **The sticker is sacred** - the collectible-player motif is the product's identity thread across modes.
5. **Real and credited** - only genuine, licensed players and photos; keep the credit trail intact.

## Accessibility & Inclusion

No product-specific standard has been established beyond the existing implementation's respect for `prefers-reduced-motion`. Treat reduced-motion support as a baseline expectation for future motion work.

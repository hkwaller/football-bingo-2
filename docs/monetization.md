# Monetization — ads + remove-ads subscription

Adsterra ads for guests/free users, with a Stripe upsell to remove them. Built
on the game-monetization skill. Entitlement is one Clerk `publicMetadata` field.

## The model

- Guests and free signed-in users see ads. **Sign-in (Clerk) is required to buy.**
- Entitlement = `publicMetadata.adFreeUntil` (ISO timestamp) on the Clerk user.
  Ads are hidden whenever it's in the future. Day pass → now+24h (stacks onto
  remaining time). Subscriptions → pushed to the current period end on each
  renewal webhook. One gate (`isAdFree`) covers both.
- Stripe customer id cached in `privateMetadata.stripeCustomerId`.

## Stripe objects (test / sandbox)

Account: **Football Bingo sandbox** (`acct_1Tw1x9Gg7LK2egGs`).
Product: **Football Bingo Ad-Free** (`prod_UvtnMfmBtwOQG9`).

| Plan  | Price   | Type      | Price ID                        | lookup_key       |
| ----- | ------- | --------- | ------------------------------- | ---------------- |
| day   | $1.99   | one_time  | `price_1Tw1zuGg7LK2egGsYNf2YxVa` | `fb_adfree_day`   |
| month | $3.99   | recurring | `price_1Tw1zyGg7LK2egGsk5OoAzjR` | `fb_adfree_month` |
| year  | $15.99  | recurring | `price_1Tw2C0Gg7LK2egGs3wzu610g` | `fb_adfree_year`  |

For **production**, recreate the product + 3 prices in live mode and swap the
`STRIPE_PRICE_*` env vars — test and live are separate namespaces.

## Environment variables

Set in `.env.local` (see `.env.local.example`). Price IDs are pre-filled; you
must still add:

- `STRIPE_SECRET_KEY` — from https://dashboard.stripe.com/test/apikeys (sandbox)
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen` (dev) or the dashboard endpoint (prod)
- `NEXT_PUBLIC_ADSTERRA_BANNER_KEY` — a 468×60 banner unit key
- `NEXT_PUBLIC_ADSTERRA_POPUNDER_SRC` — a popunder unit's full invoke.js src URL

Restart the dev server after editing `.env.local`.

## Files

- `src/lib/stripe.ts` — server Stripe client + plan→price / plan→mode mapping.
- `src/lib/entitlement.ts` — `AdFreePublicMetadata` + `isAdFree()` (isomorphic).
- `src/hooks/useAdFree.ts` — client hook reading Clerk `publicMetadata`.
- `src/app/api/stripe/checkout/route.ts` — Checkout Session (mode by plan).
- `src/app/api/stripe/portal/route.ts` — Customer Portal.
- `src/app/api/stripe/webhook/route.ts` — verifies signature, writes `adFreeUntil`.
- `src/components/AdsterraBanner.tsx` / `AdsterraPopunder.tsx` — self-gating ads.
- `src/app/go-ad-free/page.tsx` — pricing page (Prime Time Green design).

Middleware (`src/middleware.ts`) only protects `/account(.*)`, so `/go-ad-free`
and `/api/stripe/*` are already public. The webhook is authed by its signature.

## Ad placement (non-invasive — never during active play)

Banner (`<AdsterraBanner />`): home page, credits, and the solo/Tenable/Trivia
setup screens. Banner + popunder on end screens: `TenableEndScreen`,
`TriviaEndScreen`, and the solo `BingoWinModal`. Each is self-gating on
`useAdFree`, so ad-free users and guests-before-hydration see nothing.

## Webhook (dev)

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Paste the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`, restart dev.
Events handled: `checkout.session.completed` (day pass), `customer.subscription.
created|updated|deleted`.

## Test (card 4242 4242 4242 4242, any future expiry/CVC)

1. Sign in → buy day pass → ads vanish; `/go-ad-free` shows "day pass … until <time>".
2. Buy monthly → ad-free + "Manage subscription" opens the portal.
3. Cancel in portal → stays ad-free to period end, then ads return.
4. Guest/signed-out → always sees ads.

## Not yet implemented — host perk (multiplayer)

The skill's "host is ad-free → whole room is ad-free" perk is **not** wired up.
Football Bingo has **three separate Liveblocks room configs** (bingo in
`src/lib/liveblocks/client.ts`, Tenable in `src/lib/tenable/liveblocksTenable.ts`,
Trivia in `src/lib/trivia/liveblocksTrivia.ts`), and multiplayer bingo has no
end/results ad spot (the win state is inline during play). Current behavior:
ads are gated per device by each viewer's own entitlement — a paying player
never sees ads on their own device, but a free guest in a paying host's room
still does.

To add the perk later, per mode: add `hostAdFree: boolean` to that mode's room
storage, set it from the host's `useAdFree()` in the start mutation (reset on
new-game), and pass a `suppressed` prop into `<AdsterraBanner>` /
`<AdsterraPopunder>` on the in-room end screens (both already accept it).

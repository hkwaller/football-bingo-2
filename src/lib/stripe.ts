import 'server-only'
import Stripe from 'stripe'

/**
 * Server-side Stripe client + plan/price mapping for the Ad-Free product.
 *
 * There are three tiers (see the Stripe dashboard for this game's account):
 *   - `day`   one-time 24h pass (no auto-renew)  →  mode: 'payment'
 *   - `month` auto-renewing subscription          →  mode: 'subscription'
 *   - `year`  auto-renewing subscription          →  mode: 'subscription'
 *
 * Entitlement is unified as a single `adFreeUntil` timestamp on the Clerk user
 * (see lib/entitlement.ts): the day pass sets it to now+24h; subscriptions keep
 * pushing it to the current period end on each renewal webhook. Ads are hidden
 * whenever `adFreeUntil` is in the future, so both models share one gate.
 */

/**
 * Lazily-constructed Stripe client. The SDK throws if constructed with an empty
 * key, and Next evaluates route modules at build time ("Collecting page data")
 * before env vars like STRIPE_SECRET_KEY exist - so we must NOT instantiate at
 * import time. This Proxy defers construction to the first property access,
 * which only happens inside a route handler at request time.
 */
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe() as unknown as Record<string | symbol, unknown>
    return client[prop]
  },
})

export type PlanKey = 'day' | 'month' | 'year'

export function priceIdForPlan(plan: PlanKey): string | undefined {
  switch (plan) {
    case 'day':
      return process.env.STRIPE_PRICE_DAY
    case 'month':
      return process.env.STRIPE_PRICE_MONTH
    case 'year':
      return process.env.STRIPE_PRICE_YEAR
  }
}

/** Day pass is a one-time payment; the recurring tiers use subscription mode. */
export function checkoutModeForPlan(plan: PlanKey): 'payment' | 'subscription' {
  return plan === 'day' ? 'payment' : 'subscription'
}

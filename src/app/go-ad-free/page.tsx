'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SignInButton, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'

import { isAdFree, type AdFreePublicMetadata } from '@/lib/entitlement'
import type { PlanKey } from '@/lib/stripe'

type Tier = {
  plan: PlanKey
  name: string
  price: string
  cadence: string
  blurb: string
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    plan: 'day',
    name: 'Day Pass',
    price: '$1.99',
    cadence: 'one-off · 24 hours',
    blurb: 'No ads for a full day. No auto-renew.',
  },
  {
    plan: 'month',
    name: 'Monthly',
    price: '$3.99',
    cadence: 'per month',
    blurb: 'Ad-free every match. Cancel anytime.',
  },
  {
    plan: 'year',
    name: 'Yearly',
    price: '$15.99',
    cadence: 'per year',
    blurb: 'Best value — under $1.50 a month.',
    featured: true,
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
}

function formatUntil(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function GoAdFree() {
  const { user, isLoaded } = useUser()
  const params = useSearchParams()
  const [busy, setBusy] = useState<PlanKey | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const meta = (user?.publicMetadata ?? {}) as AdFreePublicMetadata
  const adFree = isAdFree(meta)
  const isSubscriber = meta.subStatus === 'active' || meta.subStatus === 'trialing'

  // After returning from Checkout the webhook writes entitlement async; poll a
  // few times so the page reflects the new status without a manual refresh.
  useEffect(() => {
    if (params.get('status') !== 'success' || !user) return
    let tries = 0
    const id = setInterval(async () => {
      tries += 1
      await user.reload()
      if (isAdFree((user.publicMetadata ?? {}) as AdFreePublicMetadata) || tries >= 6) {
        clearInterval(id)
      }
    }, 1500)
    return () => clearInterval(id)
  }, [params, user])

  async function buy(plan: PlanKey) {
    setBusy(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start checkout.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  async function openPortal() {
    setBusy('portal')
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not open the portal.')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setBusy(null)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <motion.div {...fadeUp} className="text-center">
        <span className="eyebrow eyebrow-yellow">No ads · pure football</span>
        <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] text-white sm:text-6xl">
          Go Ad-Free
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-on-green-soft">
          Kill the ads across every mode — Bingo, Tenable and Trivia. Your support keeps Football
          Bingo running.
        </p>
      </motion.div>

      {/* Ad-free banner */}
      {isLoaded && adFree && (
        <motion.div {...fadeUp} className="card mx-auto mt-8 max-w-xl p-6 text-center">
          <div className="text-3xl">🎉</div>
          <h2 className="mt-2 font-display text-2xl font-black uppercase text-card-ink">
            You&apos;re ad-free
          </h2>
          <p className="mt-1 text-card-muted">
            {meta.subStatus === 'day-pass'
              ? 'Day pass active until '
              : meta.subStatus === 'canceled'
                ? 'Access until '
                : 'Renews / active until '}
            <span className="font-mono font-bold text-card-ink">
              {formatUntil(meta.adFreeUntil)}
            </span>
          </p>
          {isSubscriber && (
            <button
              onClick={openPortal}
              disabled={busy === 'portal'}
              className="btn btn-outline btn-sm mt-4"
            >
              {busy === 'portal' ? 'Opening…' : 'Manage subscription'}
            </button>
          )}
        </motion.div>
      )}

      {/* Tiers */}
      {isLoaded && !adFree && (
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.plan}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card relative flex flex-col p-6 ${
                tier.featured ? 'ring-4 ring-yellow' : ''
              }`}
              style={{ rotate: `${(i - 1) * 0.6}deg` }}
            >
              {tier.featured && (
                <span className="eyebrow absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  Best value
                </span>
              )}
              <h3 className="font-display text-2xl font-black uppercase text-card-ink">
                {tier.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black text-card-ink">{tier.price}</span>
              </div>
              <div className="text-sm font-bold uppercase tracking-wide text-card-muted-2">
                {tier.cadence}
              </div>
              <p className="mt-3 flex-1 text-card-muted">{tier.blurb}</p>

              {user ? (
                <button
                  onClick={() => buy(tier.plan)}
                  disabled={busy === tier.plan}
                  className="btn btn-primary mt-5 w-full"
                >
                  {busy === tier.plan ? 'Starting…' : 'Choose'}
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="btn btn-primary mt-5 w-full">Sign in to buy</button>
                </SignInButton>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {isLoaded && !adFree && !user && (
        <p className="mt-4 text-center text-sm text-on-green-soft">
          Signing in also saves your highscores across devices.
        </p>
      )}

      {error && <p className="mt-6 text-center font-bold text-yellow">{error}</p>}

      <div className="mt-10 text-center">
        <Link href="/" className="btn btn-outline-light btn-sm">
          ← Back to the game
        </Link>
      </div>
    </main>
  )
}

export default function GoAdFreePage() {
  return (
    <Suspense
      fallback={<main className="px-4 py-14 text-center text-on-green-soft">Loading…</main>}
    >
      <GoAdFree />
    </Suspense>
  )
}

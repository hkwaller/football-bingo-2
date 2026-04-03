'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/35 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight text-chalk transition hover:text-[var(--fb-accent-lime)] md:text-3xl"
        >
          Football Bingo
        </Link>
        <nav className="flex items-center gap-5 text-sm font-semibold text-chalk/85">
          <Link href="/play/setup" className="hover:text-[var(--fb-accent-cyan)]">
            Solo
          </Link>
          <Link href="/room/new" className="hover:text-[var(--fb-accent-cyan)]">
            Multiplayer
          </Link>
          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-xl border border-white/25 px-4 py-2 font-semibold text-chalk hover:bg-white/10"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/account" className="hover:text-[var(--fb-accent-cyan)]">
                  Account
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

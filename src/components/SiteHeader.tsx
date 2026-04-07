'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function SiteHeader() {
  return (
    <header className="border-b-4 border-white bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="font-display text-3xl font-black tracking-widest text-[#e2ff00] transition hover:text-[#ff00cc] md:text-4xl shadow-none"
        >
          FOOTBALL BINGO
        </Link>
        <nav className="flex items-center gap-5 font-mono text-sm font-bold uppercase text-chalk">
          <Link href="/play/setup" className="hover:text-[var(--fb-accent-cyan)] hover:underline decoration-2 underline-offset-4">
            Solo
          </Link>
          <Link href="/room/new" className="hover:text-[var(--fb-accent-cyan)] hover:underline decoration-2 underline-offset-4">
            Multiplayer
          </Link>
          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="border-2 border-white bg-[var(--fb-accent-magenta)] px-4 py-2 font-bold text-black shadow-brutal-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/account" className="hover:text-[var(--fb-accent-cyan)] hover:underline decoration-2 underline-offset-4">
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

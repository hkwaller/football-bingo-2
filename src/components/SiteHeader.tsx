'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-pitch-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-2xl font-bold uppercase tracking-wide text-chalk transition-colors hover:text-turf"
        >
          Football Bingo
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-turf" />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link href="/play/setup" className="rounded-full px-3.5 py-1.5 text-chalk-dim transition-colors hover:bg-pitch-light hover:text-chalk">
            Bingo
          </Link>
          <Link href="/room/new" className="rounded-full px-3.5 py-1.5 text-chalk-dim transition-colors hover:bg-pitch-light hover:text-chalk">
            Multiplayer
          </Link>
          <Link href="/trivia/setup" className="rounded-full px-3.5 py-1.5 text-chalk-dim transition-colors hover:bg-pitch-light hover:text-chalk">
            Trivia
          </Link>
          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button type="button" className="btn btn-primary btn-sm ml-2">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/account" className="rounded-full px-3.5 py-1.5 text-chalk-dim transition-colors hover:bg-pitch-light hover:text-chalk">
                  Account
                </Link>
                <span className="ml-2">
                  <UserButton afterSignOutUrl="/" />
                </span>
              </SignedIn>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

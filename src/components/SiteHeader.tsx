'use client'

import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-chalk transition hover:text-white"
        >
          Football Bingo
        </Link>
        <nav className="flex items-center gap-4 text-sm text-chalk/80">
          <Link href="/play" className="hover:text-chalk">
            Solo
          </Link>
          <Link href="/room/new" className="hover:text-chalk">
            Multiplayer
          </Link>
          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-md border border-white/20 px-3 py-1.5 text-chalk hover:bg-white/10"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/account" className="hover:text-chalk">
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

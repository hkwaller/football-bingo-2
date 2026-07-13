'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const NAV = [
  { href: '/play', label: 'Play', match: ['/play'] },
  { href: '/room/new', label: 'Multiplayer', match: ['/room'] },
  { href: '/trivia', label: 'Trivia', match: ['/trivia'] },
]

export function SiteHeader() {
  const pathname = usePathname() ?? '/'

  return (
    <header className="border-b-[5px] border-red bg-green text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-9">
        <Link href="/" className="flex items-center gap-4 transition-opacity hover:opacity-90">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-[22px] text-green">
            ⚽
          </span>
          <span className="font-display text-[30px] uppercase leading-none tracking-[0.02em]">
            Football Bingo
          </span>
        </Link>

        <nav className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.06em]">
          {NAV.map((item) => {
            const active = item.match.some(
              (m) => pathname === m || pathname.startsWith(`${m}/`),
            )
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 transition-colors ${
                  active
                    ? 'bg-cream/[0.12] text-cream'
                    : 'text-cream-dim hover:bg-cream/[0.08] hover:text-cream'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full border-[1.5px] border-cream/40 px-4 py-2 text-cream transition-colors hover:bg-cream/[0.08]"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/play/setup"
                  className="rounded-full bg-red px-[18px] py-2 text-white transition-colors hover:bg-red-deep"
                >
                  New game
                </Link>
                <span className="ml-1 flex items-center">
                  <UserButton afterSignOutUrl="/" />
                </span>
              </SignedIn>
            </>
          ) : (
            <Link
              href="/play/setup"
              className="rounded-full bg-red px-[18px] py-2 text-white transition-colors hover:bg-red-deep"
            >
              New game
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

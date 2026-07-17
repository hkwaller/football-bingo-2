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
    <header className="relative z-20 bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-9">
        <Link href="/" className="flex items-center gap-3.5 transition-opacity hover:opacity-90">
          <span className="flex h-11 w-11 -rotate-6 items-center justify-center rounded-2xl bg-yellow text-[24px] shadow-[0_4px_0_rgba(0,0,0,0.22)]">
            ⚽
          </span>
          <span className="font-display text-[30px] font-bold uppercase leading-none tracking-[0.01em] text-white">
            Football Bingo
          </span>
          <span className="ml-1 inline-flex rotate-[4deg] animate-pulse-soft items-center rounded-md bg-live-red px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_2px_0_rgba(0,0,0,0.25)]">
            Live
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.06em]">
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
                    ? 'bg-white/[0.16] text-white'
                    : 'text-on-green-dim hover:bg-white/[0.08] hover:text-white'
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
                    className="rounded-full border-[3px] border-white/50 px-4 py-1.5 text-white transition-colors hover:bg-white/[0.12]"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/play/setup"
                  className="rounded-full bg-yellow px-[18px] py-2 text-pitch-deep shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
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
              className="rounded-full bg-yellow px-[18px] py-2 text-pitch-deep shadow-[0_4px_0_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
            >
              New game
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

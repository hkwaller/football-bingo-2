'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Menu } from 'lucide-react'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

/** The ball mark on the yellow logo tile (replaces the emoji). */
function BallMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="#f5f0e1" stroke="#0a2417" strokeWidth="2.5" />
      <path d="M16 10.5l5 3.6-1.9 5.9h-6.2L11 14.1z" fill="#0a2417" />
      <path
        d="M16 10.5V4.2M21 14.1l5.6-2M19.1 20l3.4 5M12.9 20l-3.4 5M11 14.1l-5.6-2"
        stroke="#0a2417"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  )
}

/** Every game lives behind one overview page, so the header only needs one way in. */
const PLAY_HREF = '/games'

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (match: string[]) =>
    match.some((m) => pathname === m || pathname.startsWith(`${m}/`))

  return (
    <header className="relative z-30 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-9">
        <Link href="/" className="flex items-center gap-3.5 transition-opacity hover:opacity-90">
          <span className="flex h-11 w-11 -rotate-6 items-center justify-center rounded-[10px] border-[2.5px] border-ink bg-yellow shadow-[0_4px_0_#0a2417]">
            <BallMark />
          </span>
          {/* Wordmark is desktop-only - the crest already says what this is */}
          <span className="hidden font-display text-[32px] font-black uppercase leading-none tracking-[0.02em] text-on-green sm:inline">
            Football Bingo
          </span>
          {/* <span className="ml-1 inline-flex rotate-[4deg] animate-pulse-soft items-center rounded bg-coral px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
            Live
          </span> */}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.06em] sm:flex">
          {clerkOn ? (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-lg border-[2.5px] border-surface/55 px-4 py-1.5 text-on-green transition-colors hover:bg-surface/[0.12]"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/account"
                  className={`rounded-md px-3.5 py-2 transition-colors ${
                    isActive(['/account'])
                      ? 'bg-surface/[0.12] text-on-green shadow-[inset_0_-3px_0_#ffd62e]'
                      : 'text-[#cfe3d5] hover:bg-surface/[0.08] hover:text-on-green'
                  }`}
                >
                  Profile
                </Link>
              </SignedIn>
            </>
          ) : null}

          <Link
            href={PLAY_HREF}
            className="ml-2 rounded-lg border-[2.5px] border-ink bg-yellow px-4 py-[7px] text-ink shadow-[0_4px_0_#0a2417] transition-transform hover:-translate-y-0.5"
          >
            Play
          </Link>

          {clerkOn ? (
            <SignedIn>
              <span className="ml-1 flex items-center">
                <UserButton afterSignOutUrl="/" />
              </span>
            </SignedIn>
          ) : null}
        </nav>

        {/* Mobile: Play stays visible, account bits go in the menu */}
        <div className="flex items-center gap-2.5 sm:hidden">
          <Link
            href={PLAY_HREF}
            className="rounded-lg border-[2.5px] border-ink bg-yellow px-5 py-2 text-[14px] font-extrabold uppercase tracking-[0.06em] text-ink shadow-[0_4px_0_#0a2417] transition-transform hover:-translate-y-0.5"
          >
            Play
          </Link>
          {clerkOn ? (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg border-[2.5px] border-surface/55 text-on-green transition-colors hover:bg-surface/[0.12]"
            >
              <Menu className="size-5 text-on-green" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-black/40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              className="absolute right-6 top-[76px] z-40 flex w-[min(240px,80vw)] flex-col gap-1.5 rounded-[14px] border-[2.5px] border-ink bg-surface p-3 shadow-[0_6px_0_#0a2417] sm:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {clerkOn ? (
                <>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        onClick={() => setMenuOpen(false)}
                        className="btn btn-outline w-full"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className={`rounded-md px-4 py-2.5 text-[14px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
                        isActive(['/account'])
                          ? 'bg-yellow text-ink'
                          : 'text-card-muted hover:bg-card-tint hover:text-card-ink'
                      }`}
                    >
                      Profile
                    </Link>
                    <div className="mt-1 flex items-center justify-center pt-1">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </>
              ) : null}
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

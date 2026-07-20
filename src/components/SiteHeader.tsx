'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Menu } from 'lucide-react'

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const NAV = [
  { href: '/play', label: 'Play', match: ['/play'] },
  { href: '/room/new', label: 'Multiplayer', match: ['/room'] },
  { href: '/trivia', label: 'Trivia', match: ['/trivia'] },
]

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (match: string[]) =>
    match.some((m) => pathname === m || pathname.startsWith(`${m}/`))

  return (
    <header className="relative z-30 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-9">
        <Link href="/" className="flex items-center gap-3.5 transition-opacity hover:opacity-90">
          <span className="flex h-11 w-11 -rotate-6 items-center justify-center rounded-2xl bg-yellow text-[24px] shadow-[0_4px_0_rgba(0,0,0,0.22)]">
            ⚽
          </span>
          {/* Wordmark is desktop-only — the crest already says what this is */}
          <span className="hidden font-display text-[30px] font-bold uppercase leading-none tracking-[0.01em] text-white sm:inline">
            Football Bingo
          </span>
          <span className="ml-1 inline-flex rotate-[4deg] animate-pulse-soft items-center rounded-md bg-live-red px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_2px_0_rgba(0,0,0,0.25)]">
            Live
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.06em] sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors ${
                isActive(item.match)
                  ? 'bg-white/[0.16] text-white'
                  : 'text-on-green-dim hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}

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

        {/* Mobile cog */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border-[3px] border-white/50 text-[20px] text-white transition-colors hover:bg-white/[0.12] sm:hidden"
        >
          <Menu className="size-5 text-white" />
        </button>
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
              className="absolute right-6 top-[76px] z-40 flex w-[min(240px,80vw)] flex-col gap-1.5 rounded-[20px] bg-white p-3 shadow-[0_8px_0_rgba(0,0,0,0.22)] sm:hidden"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-full px-4 py-2.5 text-[14px] font-extrabold uppercase tracking-[0.06em] transition-colors ${
                    isActive(item.match)
                      ? 'bg-green-go text-white'
                      : 'text-card-muted hover:bg-card-tint hover:text-card-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-1 h-px bg-card-tint" />

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
                      href="/play/setup"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-primary w-full"
                    >
                      New game
                    </Link>
                    <div className="mt-1 flex items-center justify-center pt-1">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </>
              ) : (
                <Link
                  href="/play/setup"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary w-full"
                >
                  New game
                </Link>
              )}
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}

import type { Metadata } from 'next'
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import './globals.css'

const display = Bebas_Neue({
  weight: '400',
  variable: '--font-display',
  subsets: ['latin'],
})

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Football Bingo',
  description: 'Bingo with football player trivia',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] font-sans antialiased text-chalk`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

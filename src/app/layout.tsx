import type { Metadata } from 'next'
import { Barlow_Condensed, Instrument_Sans, Spline_Sans_Mono } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import './globals.css'

const display = Barlow_Condensed({
  weight: ['500', '600', '700'],
  variable: '--font-display',
  subsets: ['latin'],
})

const sans = Instrument_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

const mono = Spline_Sans_Mono({
  weight: ['400', '500', '600'],
  variable: '--font-mono',
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
        className={`${display.variable} ${sans.variable} ${mono.variable} relative min-h-screen bg-pitch-dark font-sans antialiased text-chalk`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

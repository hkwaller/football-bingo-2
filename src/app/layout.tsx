import type { Metadata } from 'next'
import { Passion_One, Libre_Franklin, Courier_Prime } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import './globals.css'

const display = Passion_One({
  weight: ['400', '700', '900'],
  variable: '--font-display',
  subsets: ['latin'],
})

const sans = Libre_Franklin({
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  subsets: ['latin'],
})

const mono = Courier_Prime({
  weight: ['400', '700'],
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
        className={`${display.variable} ${sans.variable} ${mono.variable} relative min-h-screen font-sans antialiased text-on-green`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

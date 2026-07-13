import type { Metadata } from 'next'
import { Anton, Libre_Franklin, Courier_Prime } from 'next/font/google'
import { AppShell } from '@/components/AppShell'
import './globals.css'

const display = Anton({
  weight: '400',
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
        className={`${display.variable} ${sans.variable} ${mono.variable} relative min-h-screen bg-paper font-sans antialiased text-ink`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

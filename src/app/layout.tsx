import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { AppShell } from '@/components/AppShell'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo'
import './globals.css'

// Fonts are self-hosted (see src/app/fonts/README.md) so builds never depend on
// Google Fonts, whose occasional /l/font?kit= responses break next/font/google.

// Variable font with an optical-size axis: large headlines get the Display cut.
const display = localFont({
  src: './fonts/BigShoulders-Variable.woff2',
  weight: '100 900',
  variable: '--font-display',
})

const sans = localFont({
  src: './fonts/Archivo-Variable.woff2',
  weight: '400 800',
  variable: '--font-sans',
})

const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-Medium.woff2', weight: '500' },
    { path: './fonts/IBMPlexMono-SemiBold.woff2', weight: '600' },
    { path: './fonts/IBMPlexMono-Bold.woff2', weight: '700' },
  ],
  variable: '--font-mono',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e4a2c',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Know football? Prove it.`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Know football? Prove it.`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Know football? Prove it.`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}

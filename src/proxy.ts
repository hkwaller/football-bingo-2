import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const isProtected = createRouteMatcher(['/account(.*)'])

/**
 * The native app (user agent tagged in capacitor.config.ts) gets its own home
 * screen at `/app` while the URL stays `/`, so links and the logo keep working.
 */
function appHome(req: NextRequest) {
  if (req.nextUrl.pathname !== '/') return null
  if (!req.headers.get('user-agent')?.includes('FootballBingoApp')) return null
  return NextResponse.rewrite(new URL('/app', req.url))
}

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) await auth.protect()
      return appHome(req) ?? undefined
    })
  : function proxy(request: NextRequest) {
      return appHome(request) ?? NextResponse.next()
    }

export const config = {
  matcher: [
    '/((?!_next|ingest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

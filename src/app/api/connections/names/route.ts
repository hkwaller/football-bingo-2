import { connectionsBankNames } from '@/data/connections'

export const runtime = 'nodejs'

/** Every player we know the clubs of - a guess outside this list is never marked wrong. */
export async function GET() {
  return Response.json(
    { names: connectionsBankNames },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  )
}

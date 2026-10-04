/** iOS bundle id (Xcode PRODUCT_BUNDLE_IDENTIFIER; differs from the Android package). */
const IOS_BUNDLE_ID = 'app.playam.football-bingo'

/**
 * iOS universal links: links to this site (room QR codes, invite links) open
 * the native app when it is installed. Needs APPLE_TEAM_ID; 404 without it.
 */
export function GET() {
  const team = process.env.APPLE_TEAM_ID
  if (!team) return new Response('Not found', { status: 404 })
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [`${team}.${IOS_BUNDLE_ID}`],
          components: [{ '/': '/*', comment: 'Every page opens in the app' }],
        },
      ],
    },
  })
}

/** Bundle id / package name of the native app (capacitor.config.ts). */
const NATIVE_APP_ID = 'app.playam.bingo'

/**
 * Android App Links: same as the Apple file, for the Play build. Needs
 * ANDROID_CERT_SHA256 (comma-separated fingerprints from Play Console); 404 without it.
 */
export function GET() {
  const prints = process.env.ANDROID_CERT_SHA256?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!prints?.length) return new Response('Not found', { status: 404 })
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: NATIVE_APP_ID,
        sha256_cert_fingerprints: prints,
      },
    },
  ])
}

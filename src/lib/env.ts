export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  return typeof pk === 'string' && pk.length > 0
}

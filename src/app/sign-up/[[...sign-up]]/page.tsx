import { redirect } from 'next/navigation'

export const metadata = { title: 'Continue with email', robots: { index: false, follow: false } }

// Keep old sign-up links working while both account flows use the same form.
export default async function SignUpPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach(item => query.append(key, item))
    else if (value !== undefined) query.set(key, value)
  }
  redirect(`/sign-in${query.size ? `?${query}` : ''}`)
}

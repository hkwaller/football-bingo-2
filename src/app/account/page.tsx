import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/env'

export default async function AccountPage() {
  if (!isClerkConfigured()) redirect('/')
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-chalk">Account</h1>
      <p className="mt-4 text-base leading-relaxed text-chalk/65">
        You are signed in. Game history will attach to your account when Supabase
        is configured.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block font-semibold text-[var(--fb-accent-lime)] hover:underline"
      >
        Back home
      </Link>
    </div>
  )
}

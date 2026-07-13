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
      <h1 className="font-display text-5xl font-semibold uppercase tracking-wide text-chalk">
        Account
      </h1>
      <div className="card mt-6 p-6">
        <p className="text-base leading-relaxed text-chalk-dim">
          You are signed in. Game history will attach to your account when
          Supabase is configured.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-turf transition-colors hover:text-chalk"
      >
        Back home
      </Link>
    </div>
  )
}

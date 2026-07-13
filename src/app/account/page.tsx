import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/env'

export default async function AccountPage() {
  if (!isClerkConfigured()) redirect('/')
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-[52px] uppercase leading-none text-green">Account</h1>
      <div className="panel mt-6 p-6">
        <p className="text-base font-medium leading-relaxed text-muted">
          You are signed in. Game history will attach to your account when Supabase is configured.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-bold uppercase tracking-[0.06em] text-red transition-colors hover:text-red-deep"
      >
        Back home
      </Link>
    </div>
  )
}

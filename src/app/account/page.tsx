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
      <h1 className="font-display text-[52px] font-black uppercase leading-none text-white">Account</h1>
      <div className="panel mt-6 p-6">
        <p className="text-base font-semibold leading-relaxed text-card-muted">
          You are signed in. Game history will attach to your account when Supabase is configured.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-bold uppercase tracking-[0.06em] text-yellow transition-colors hover:text-yellow-deep"
      >
        Back home
      </Link>
    </div>
  )
}

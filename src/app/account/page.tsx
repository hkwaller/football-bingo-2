import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/env'

export default async function AccountPage() {
  if (!isClerkConfigured()) redirect('/')
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-chalk">Account</h1>
      <p className="mt-2 text-sm text-chalk/60">
        You are signed in. Game history will attach to your account when Supabase
        is configured.
      </p>
      <Link href="/" className="mt-6 inline-block text-emerald-400 hover:underline">
        Back home
      </Link>
    </div>
  )
}

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { isClerkConfigured } from '@/lib/env'

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="card p-6">
          <p className="text-sm leading-relaxed text-chalk-dim">
            Clerk is not configured. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.
          </p>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-turf transition-colors hover:text-chalk"
        >
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 py-12">
      <h1 className="font-display text-4xl font-semibold uppercase tracking-wide text-chalk">
        Sign in
      </h1>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  )
}

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { isClerkConfigured } from '@/lib/env'

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="panel p-6">
          <p className="text-sm font-medium leading-relaxed text-muted">
            Clerk is not configured. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.
          </p>
        </div>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-bold uppercase tracking-[0.06em] text-red transition-colors hover:text-red-deep"
        >
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-6 py-12">
      <h1 className="font-display text-[44px] uppercase leading-none text-green">Sign in</h1>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  )
}

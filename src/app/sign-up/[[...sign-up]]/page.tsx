import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { isClerkConfigured } from '@/lib/env'

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-chalk/80">
        <p>Clerk is not configured. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment.</p>
        <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
          Home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  )
}

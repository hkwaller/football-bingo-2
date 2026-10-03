import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Delete the signed-in account: stats and history in Supabase first
 * (`football_bingo_delete_identity`), then the Clerk user. The id comes from
 * Clerk, never the request, so this can only ever delete yourself.
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  try {
    const admin = getSupabaseAdmin()
    if (admin) {
      const { error } = await admin.rpc('football_bingo_delete_identity', { p_id: userId })
      if (error) throw error
    }
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete-account failed', err)
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

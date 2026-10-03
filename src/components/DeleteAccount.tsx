'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'

import { backupDeviceStorage } from '@/lib/native'

/** The game's localStorage keys (settings, sessions, guest id, name), as in lib/native.ts. */
const DEVICE_KEY = /^(fb_|football-)/

/**
 * Deletes the account and everything stored about it (App Store rule
 * 5.1.1(v)). Two steps so it can't happen by accident. Afterwards this device
 * starts over as a fresh guest.
 */
export function DeleteAccount() {
  const { signOut } = useClerk()
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting' | 'failed'>('idle')

  const remove = async () => {
    setStep('deleting')
    const res = await fetch('/api/delete-account', { method: 'POST' }).catch(() => null)
    if (!res?.ok) {
      setStep('failed')
      return
    }
    for (const key of Object.keys(localStorage))
      if (DEVICE_KEY.test(key)) localStorage.removeItem(key)
    await backupDeviceStorage()
    await signOut({ redirectUrl: '/' })
  }

  return (
    <section className="panel mt-14 p-6">
      <h2 className="font-display text-[26px] font-black uppercase leading-none text-card-ink">
        Delete account
      </h2>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-card-muted">
        Removes your account, your solo and Tenable history, and your name from past rooms. This
        can&apos;t be undone.
      </p>
      {step === 'idle' ? (
        <button
          type="button"
          onClick={() => setStep('confirm')}
          className="btn btn-outline btn-sm mt-4"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={step === 'deleting'}
            className="btn btn-sm border-card-ink bg-coral-ink text-surface-hi"
          >
            {step === 'deleting' ? 'Deleting…' : 'Yes, delete everything'}
          </button>
          <button
            type="button"
            onClick={() => setStep('idle')}
            disabled={step === 'deleting'}
            className="btn btn-outline btn-sm"
          >
            Keep my account
          </button>
          {step === 'failed' && (
            <p role="alert" className="w-full text-sm font-bold text-coral-ink">
              Something went wrong. Try again in a moment.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

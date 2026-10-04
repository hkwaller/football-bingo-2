'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { RoomConnecting, type RoomGameMode } from '@/components/RoomConnecting'

/**
 * Host-removes-player. The host broadcasts a kick event naming a player id (the
 * same id the lobby list uses); the named client drops out by unmounting its
 * RoomProvider and remembers it for this tab, so reopening the link doesn't
 * walk them straight back in. Cooperative, like the rest of the room logic.
 */
export type KickEvent = { type: 'kick'; id: string }

export function isKickFor(event: unknown, myId: string | number | null | undefined): boolean {
  if (myId == null || !event || typeof event !== 'object') return false
  const e = event as Partial<KickEvent>
  return e.type === 'kick' && e.id === String(myId)
}

const removedKey = (roomId: string) => `fb_removed:${roomId}`

const LeaveContext = createContext<() => void>(() => {})

/** Call when this client receives a kick aimed at it. */
export const useLeaveAsRemoved = () => useContext(LeaveContext)

export function RoomKickGate({
  roomId,
  mode,
  children,
}: {
  roomId: string
  mode: RoomGameMode
  children: ReactNode
}) {
  const [state, setState] = useState<'checking' | 'in' | 'removed'>('checking')

  useEffect(() => {
    let removed = false
    try {
      removed = window.sessionStorage.getItem(removedKey(roomId)) === '1'
    } catch {}
    setState(removed ? 'removed' : 'in')
  }, [roomId])

  const leave = useCallback(() => {
    try {
      window.sessionStorage.setItem(removedKey(roomId), '1')
    } catch {}
    setState('removed')
  }, [roomId])

  if (state === 'checking') return <RoomConnecting mode={mode} />
  if (state === 'removed') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="panel max-w-md p-6 text-center">
          <p className="eyebrow eyebrow-sky mb-3">Subbed off</p>
          <h1 className="font-display text-[34px] font-black uppercase leading-[0.92] text-card-ink">
            The gaffer removed you from this room
          </h1>
          <Link href="/" className="btn btn-primary mt-5 inline-flex">
            Home
          </Link>
        </div>
      </div>
    )
  }
  return <LeaveContext.Provider value={leave}>{children}</LeaveContext.Provider>
}

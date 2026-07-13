'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  durationMs: number
  startedAt: number
  paused?: boolean
  onExpire?: () => void
}

export function TriviaProgressBar({ durationMs, startedAt, paused, onExpire }: Props) {
  const [progress, setProgress] = useState(1) // 1 = full, 0 = empty
  const rafRef = useRef<number | null>(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = false

    function tick() {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, 1 - elapsed / durationMs)
      setProgress(remaining)

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
        return
      }

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [durationMs, startedAt, paused, onExpire])

  const dangerZone = progress < 0.25
  const color = dangerZone ? 'var(--red)' : progress < 0.5 ? 'var(--gold)' : 'var(--red)'

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(38,32,25,0.12)]">
      <motion.div
        className="h-full rounded-full transition-colors duration-300"
        style={{ width: `${progress * 100}%`, backgroundColor: color }}
        animate={dangerZone ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
        transition={dangerZone ? { repeat: Infinity, duration: 0.5 } : {}}
      />
    </div>
  )
}

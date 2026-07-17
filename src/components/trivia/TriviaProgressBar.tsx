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

  return (
    <div className="h-3.5 w-full overflow-hidden rounded-full bg-black/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
      <motion.div
        className="h-full rounded-full"
        style={{
          width: `${progress * 100}%`,
          backgroundImage: 'linear-gradient(90deg,#ffe23a,#ff4d8d)',
        }}
        animate={dangerZone ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
        transition={dangerZone ? { repeat: Infinity, duration: 0.5 } : {}}
      />
    </div>
  )
}

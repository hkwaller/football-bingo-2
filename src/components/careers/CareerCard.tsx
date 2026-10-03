'use client'

import { motion } from 'framer-motion'
import type { CareerSpell, CareerStint } from '@/lib/careers/types'

/** "2011–2014", "2025", "2024–" */
export function yearsLabel(s: Pick<CareerStint, 'from' | 'to'>): string {
  if (s.to === null) return `${s.from}–`
  if (s.to === s.from) return String(s.from)
  return `${s.from}–${s.to}`
}

function Row({
  stint,
  loan,
  nested,
  index,
}: {
  stint: CareerStint
  loan?: boolean
  nested?: boolean
  index: number
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`flex items-baseline gap-3 py-2 ${nested ? 'pl-[88px] md:pl-[104px]' : ''}`}
    >
      {!nested && (
        <span className="w-[76px] shrink-0 font-mono text-[13px] font-bold tabular-nums text-card-muted md:w-[92px] md:text-[14px]">
          {yearsLabel(stint)}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {nested && (
          <span className="font-mono text-[12px] font-bold tabular-nums text-card-muted-2">
            ↳ {yearsLabel(stint)}
          </span>
        )}
        <span
          className={`font-display font-black uppercase leading-tight ${
            nested
              ? 'text-[16px] text-card-muted md:text-[18px]'
              : 'text-[20px] text-card-ink md:text-[24px]'
          }`}
        >
          {stint.club}
        </span>
        {loan && (
          <span className="rounded-full bg-sky/25 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-card-ink">
            Loan
          </span>
        )}
      </span>
    </motion.li>
  )
}

/** The career path: one row per permanent spell, loans nested beneath their parent club. */
export function CareerCard({ career }: { career: CareerSpell[] }) {
  let index = 0
  return (
    <ol className="divide-y divide-dotted divide-card-ink/15 rounded-[14px] bg-surface px-4 py-2 shadow-[0_6px_0_#0a2417] md:px-6">
      {career.map((spell) => (
        <li key={`${spell.clubId}-${spell.from}`} className="list-none">
          <ol>
            <Row stint={spell} loan={spell.loan} index={index++} />
            {spell.loans.map((l) => (
              <Row key={`${l.clubId}-${l.from}`} stint={l} loan nested index={index++} />
            ))}
          </ol>
        </li>
      ))}
    </ol>
  )
}

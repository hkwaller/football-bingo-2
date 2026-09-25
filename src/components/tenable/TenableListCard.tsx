'use client'

import type { TenableQuestion } from '@/data/tenable'
import { groupLabel } from '@/lib/tenable/setupMeta'

const DIFF_CLASS = {
  easy: 'bg-green-go/20 text-green-go',
  medium: 'bg-yellow/35 text-card-ink',
  hard: 'bg-red/20 text-red',
} as const

export function TenableListCard({
  question,
  onPick,
}: {
  question: TenableQuestion
  onPick: () => void
}) {
  const open = question.kind === 'open'
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex h-full w-full flex-col rounded-[14px] bg-surface p-4 text-left shadow-[0_6px_0_#0a2417] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0a2417] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch active:translate-y-[3px] active:shadow-[0_2px_0_#0a2417]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-card-tint px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-card-ink">
          {groupLabel(question.group)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${DIFF_CLASS[question.difficulty]}`}
        >
          {question.difficulty}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          aria-hidden
          className={`inline-flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[10px] font-display font-black uppercase leading-none md:h-16 md:w-16 ${
            open ? 'bg-pink/20 text-pink' : 'bg-yellow text-ink'
          }`}
        >
          <span className="text-[10px] tracking-[0.08em]">{open ? 'Any' : 'Top'}</span>
          <span className="text-[26px] md:text-[30px]">10</span>
        </span>
        <p className="min-w-0 font-display text-[22px] font-black uppercase leading-[0.9] text-card-ink md:text-[24px]">
          {question.category}
        </p>
      </div>

      <p className="mt-3 text-[12px] font-semibold leading-snug text-card-muted">
        {question.prompt}
      </p>
      <p className="mt-auto pt-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-card-muted-2">
        {open
          ? `Name any 10 · ${question.answers.length} valid answers`
          : question.ordered
            ? 'Ranked top 10'
            : 'Top 10'}
      </p>
    </button>
  )
}

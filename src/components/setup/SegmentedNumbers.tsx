'use client'

import type { ReactNode } from 'react'

export type SegmentOption = {
  value: number
  /** Optional Courier-Prime sub-line under the numeral (e.g. "10 answers"). */
  sub?: string
}

/**
 * Three big-numeral tiles for "How many questions / lists / lives". Selected →
 * grass fill, lifted with a small tilt; unselected → mint. An optional helper
 * line sits below the row.
 */
export function SegmentedNumbers({
  options,
  value,
  onChange,
  ariaLabel,
  helper,
  numberClass = 'text-[26px]',
}: {
  options: SegmentOption[]
  value: number
  onChange: (v: number) => void
  ariaLabel: string
  helper?: ReactNode
  /** Numeral size — mocks use 26–30px depending on screen. */
  numberClass?: string
}) {
  return (
    <div>
      <div className="flex gap-[9px]" role="radiogroup" aria-label={ariaLabel}>
        {options.map((opt, i) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              style={active ? { transform: 'rotate(-1deg)' } : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[14px] py-3 leading-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transform-none ${
                active
                  ? 'bg-green-go text-ink shadow-[0_5px_0_#0a2417]'
                  : 'bg-card-tint text-card-muted hover:-translate-y-px hover:text-card-ink'
              }`}
            >
              <span className={`font-display font-black uppercase ${numberClass}`}>{opt.value}</span>
              {opt.sub && (
                <span
                  className={`font-mono text-[11px] ${active ? 'text-on-green/80' : 'text-card-muted-2'}`}
                >
                  {opt.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {helper && (
        <p className="mt-2 font-mono text-[12px] font-bold text-card-muted-2">{helper}</p>
      )}
    </div>
  )
}

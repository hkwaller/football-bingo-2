'use client'

import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

export type ReadoutField = { label: string; value: string }

/**
 * The fixed kick-off bar across the bottom of the viewport. Left: a live readout
 * of the configured game (four label/value fields on desktop, one summary line on
 * mobile). Right: an optional hint and the primary CTA, which never scrolls away.
 */
export function KickoffBar({
  fields,
  mobilePrimary,
  mobileDetail,
  hint,
  ctaLabel,
  onCta,
  disabled = false,
}: {
  fields: ReadoutField[]
  /** Passion One summary line shown on mobile in place of the readout fields. */
  mobilePrimary: string
  /** Courier-Prime detail line under the mobile summary. */
  mobileDetail: string
  hint?: ReactNode
  ctaLabel: string
  onCta: () => void
  disabled?: boolean
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-white/[0.16] bg-pitch-deep px-[18px] pb-[max(env(safe-area-inset-bottom),13px)] pt-[13px] md:px-10 md:py-4">
      <div className="mx-auto flex max-w-[1440px] items-center gap-7">
        {/* Desktop readout */}
        <div className="hidden min-w-0 items-center gap-[22px] md:flex">
          {fields.map((f, i) => (
            <div key={f.label} className="flex items-center gap-[22px]">
              {i > 0 && <span className="h-[34px] w-0.5 shrink-0 bg-white/20" />}
              <div className="min-w-0">
                <p className="font-mono text-[10.5px] uppercase leading-none tracking-[0.1em] text-on-green-dim">
                  {f.label}
                </p>
                <p className="mt-1 truncate font-display text-[22px] font-black uppercase leading-none text-white">
                  {f.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile summary */}
        <div className="min-w-0 flex-1 md:hidden">
          <p className="truncate font-display text-[17px] font-black uppercase leading-none text-white">
            {mobilePrimary}
          </p>
          <p className="mt-1 truncate font-mono text-[11px] text-on-green-dim">{mobileDetail}</p>
        </div>

        {/* Right group: hint + CTA */}
        <div className="ml-auto flex shrink-0 items-center gap-5">
          {hint && (
            <span className="hidden text-[12.5px] font-bold text-on-green-dim lg:inline">
              {hint}
            </span>
          )}
          <button
            type="button"
            onClick={onCta}
            disabled={disabled}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-yellow px-5 py-[13px] font-sans text-[13.5px] font-extrabold uppercase tracking-[0.08em] text-pitch-deep transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-deep md:px-[34px] md:py-[18px] md:text-[17px] ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'shadow-[0_6px_0_rgba(0,0,0,0.32)] hover:-translate-y-0.5 hover:bg-yellow-deep active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.32)]'
            }`}
          >
            {ctaLabel}
            <ArrowRight size={19} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  )
}

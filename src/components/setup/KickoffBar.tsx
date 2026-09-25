'use client'

import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

export type ReadoutField = { label: string; value: string }

/**
 * The fixed kick-off bar across the bottom of the viewport. Left: a live readout
 * of the configured game (label/value fields from lg, one summary line below
 * that). Right: an optional hint and the primary CTA, which never scrolls away.
 * Without `onCta` the CTA becomes a passive waiting pill (lobby guests), shortened
 * to "Waiting" on mobile.
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
  /** Omit to render a non-interactive waiting pill (with `ctaLabel` as its text) instead of the CTA. */
  onCta?: () => void
  disabled?: boolean
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-surface/[0.16] bg-pitch-deep px-[18px] pb-[max(env(safe-area-inset-bottom),13px)] pt-[13px] md:px-10 md:py-4">
      <div className="mx-auto flex max-w-[1440px] items-center gap-7">
        {/* Desktop readout: fields shrink and truncate so they never reach the CTA */}
        <div className="hidden min-w-0 flex-1 items-center gap-[22px] overflow-hidden lg:flex">
          {fields.map((f, i) => (
            <div key={f.label} className="flex min-w-0 max-w-[240px] items-center gap-[22px]">
              {i > 0 && <span className="h-[34px] w-0.5 shrink-0 bg-surface/20" />}
              <div className="min-w-0">
                <p className="truncate font-mono text-[10.5px] uppercase leading-none tracking-[0.1em] text-on-green-dim">
                  {f.label}
                </p>
                <p className="mt-1 truncate font-display text-[22px] font-black uppercase leading-none text-on-green">
                  {f.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Compact summary below lg */}
        <div className="min-w-0 flex-1 lg:hidden">
          <p className="truncate font-display text-[17px] font-black uppercase leading-none text-on-green md:text-[20px]">
            {mobilePrimary}
          </p>
          <p className="mt-1 truncate font-mono text-[11px] text-on-green-dim md:text-[12px]">
            {mobileDetail}
          </p>
        </div>

        {/* Right group: hint + CTA */}
        <div className="ml-auto flex shrink-0 items-center gap-5">
          {hint && (
            <span className="hidden max-w-[200px] text-right text-[12.5px] font-bold leading-snug text-on-green-dim xl:inline">
              {hint}
            </span>
          )}
          {onCta ? (
            <button
              type="button"
              onClick={onCta}
              disabled={disabled}
              className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full bg-yellow px-5 py-[13px] font-sans text-[13.5px] font-extrabold uppercase tracking-[0.08em] text-ink transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch-deep md:px-[34px] md:py-[18px] md:text-[17px] ${
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'shadow-[0_6px_0_#0a2417] hover:-translate-y-0.5 hover:bg-yellow-deep active:translate-y-[3px] active:shadow-[0_2px_0_#0a2417]'
              }`}
            >
              {ctaLabel}
              <ArrowRight size={19} strokeWidth={3} />
            </button>
          ) : (
            <span
              role="status"
              className="inline-flex min-h-[44px] items-center gap-2.5 whitespace-nowrap rounded-full border-2 border-surface/25 px-5 py-[11px] font-sans text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-on-green-soft md:px-7 md:py-4 md:text-[15px]"
            >
              <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-pink" />
              <span className="md:hidden">Waiting</span>
              <span className="hidden md:inline">{ctaLabel}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

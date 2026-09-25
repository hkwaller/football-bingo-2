'use client'

export type Chip<T extends string> = { value: T; label: string }

/** A labelled row of single-select filter pills (setup galleries). */
export function ChipRow<T extends string>({
  label,
  chips,
  value,
  onChange,
}: {
  label: string
  chips: Chip<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-green-dim">
        {label}
      </span>
      {chips.map((c) => {
        const active = c.value === value
        return (
          <button
            key={c.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c.value)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.04em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-pitch ${
              active
                ? 'bg-yellow text-ink shadow-[0_3px_0_#0a2417]'
                : 'border border-surface/15 bg-surface/10 text-on-green hover:bg-surface/[0.22]'
            }`}
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

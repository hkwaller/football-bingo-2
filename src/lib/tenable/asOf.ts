const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-01" → "Oct 2026". Parsed by hand so server and client render the same text. */
export function formatAsOf(asOf: string): string {
  const [year, month] = asOf.split('-').map(Number)
  return `${MONTHS[month - 1]} ${year}`
}

/** "Figures as of Oct 2026", or null for lists with no `asOf`. */
export function asOfLabel(asOf: string | undefined): string | null {
  return asOf ? `Figures as of ${formatAsOf(asOf)}` : null
}

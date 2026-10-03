/**
 * Turn a raw Transfermarkt transfer history into a Careers path. Pure; the
 * pipeline around it is scripts/buildCareers.ts (see there for the rules).
 */
import { clubs, getDisplayName } from '@/data/clubs'
import { CLUB_NAME_OVERRIDES } from './clubNames'
import type { CareerSpell, CareerStint } from './types'

/** One row of Transfermarkt's ceapi transferHistory (scripts/fetchCareerTransfers.ts). */
export interface RawTransfer {
  from: { clubName: string; href: string }
  to: { clubName: string; href: string }
  /** dd/mm/yyyy */
  date: string
  /** yyyy-mm-dd */
  dateUnformatted: string
  upcoming: boolean
  season: string
  /** "€15.00m", "free transfer", "loan transfer", "Loan fee:...", "End of loan", "-", "?" */
  fee: string
}

/** Spells joined before this age are boyhood clubs, not the senior career. */
const MIN_AGE = 16

/** Transfermarkt pseudo-clubs: Retired, Without Club, Career break, Ban, Unknown. */
const NON_CLUB_IDS = new Set(['123', '515', '2113', '2077', '75'])
const NON_CLUB_RE = /^(retired|without club|career break|ban|unknown|vereinslos)$/i
/** Youth, reserve and B sides: name suffixes, plus the B teams with names of their own. */
const YOUTH_RE =
  /\b(u\d{2}|u-\d{2}|sub-?\d{2}|yth\.?|youth|jgd\.?|jv|academy|acad\.?|primavera|reserves?|res\.|ii|iii|b|c|jong|amateure?|amat\.?|juvenil|prom\.?)$|[-/](1\d|2[0-3])$|^jong |\bcastilla\b|\bmadrile[ñn]o$|^sevilla atl|\byouth\b|\bu\d{2}\b/i

const clubIdToDisplay = new Map(clubs.map((c) => [c.id, getDisplayName(c.canonicalName)]))

function clubId(href: string): string {
  return href.match(/\/verein\/(\d+)/)?.[1] ?? ''
}

function isNonClub(t: RawTransfer['to']): boolean {
  return NON_CLUB_IDS.has(clubId(t.href)) || NON_CLUB_RE.test(t.clubName.trim())
}

function isYouth(name: string): boolean {
  return YOUTH_RE.test(name.trim())
}

type Kind = 'loan' | 'loan-end' | 'permanent'
function kindOf(fee: string): Kind {
  const f = fee.toLowerCase()
  if (f.includes('end of loan')) return 'loan-end'
  if (f.includes('loan')) return 'loan'
  return 'permanent'
}

const yearOf = (iso: string) => Number(iso.slice(0, 4))

interface OpenStint {
  clubId: string
  club: string
  from: string
  to: string | null
}
interface OpenSpell extends OpenStint {
  loans: OpenStint[]
  /** A loan with no tracked parent club (loaned straight out of the academy). */
  loan?: boolean
}

function displayClub(id: string, rawName: string): string {
  return CLUB_NAME_OVERRIDES[id] ?? clubIdToDisplay.get(id) ?? rawName
}

export function buildCareer(
  transfers: RawTransfer[],
  dateOfBirth: string | undefined,
  today: string,
): CareerSpell[] {
  const ordered = transfers
    .map((t, i) => ({ t, i, date: t.dateUnformatted }))
    .filter(({ date }) => date && date <= today)
    // Raw list is newest first; equal dates keep that relative order reversed.
    .sort((a, b) => (a.date === b.date ? b.i - a.i : a.date < b.date ? -1 : 1))

  const minDate = dateOfBirth
    ? `${yearOf(dateOfBirth) + MIN_AGE}${dateOfBirth.slice(4, 10)}`
    : '0000-00-00'

  const spells: OpenSpell[] = []
  let parent: OpenSpell | null = null
  let loan: OpenStint | null = null

  const closeLoan = (date: string) => {
    if (loan) loan.to = date
    loan = null
  }
  const closeParent = (date: string) => {
    closeLoan(date)
    if (parent) parent.to = date
    parent = null
  }

  for (const { t, date } of ordered) {
    const kind = kindOf(t.fee)
    const toId = clubId(t.to.href)
    const toName = t.to.clubName

    if (isNonClub(t.to)) {
      closeParent(date)
      continue
    }
    const senior = !isYouth(toName) && date >= minDate

    if (kind === 'loan-end') {
      closeLoan(date)
      // Returning from loan to a club we don't track (e.g. a reserve side, or
      // the loan started from a dropped youth team): just resume the parent.
      if (!parent && senior) parent = pushSpell(spells, toId, toName, date)
      continue
    }

    if (kind === 'loan') {
      if (!senior) continue
      closeLoan(date)
      if (parent && parent.clubId === toId) continue
      loan = { clubId: toId, club: displayClub(toId, toName), from: date, to: null }
      if (parent) parent.loans.push(loan)
      else {
        // Loaned straight out of a youth/reserve side: a standalone loan row.
        const solo: OpenSpell = { ...loan, loans: [], loan: true }
        spells.push(solo)
        loan = solo
      }
      continue
    }

    // Permanent move.
    if (!senior) {
      // Promotions inside a youth set-up, or a first-team player dropped to the
      // reserves: neither changes the senior career.
      continue
    }
    if (parent && parent.clubId === toId) {
      closeLoan(date)
      continue
    }
    closeParent(date)
    parent = pushSpell(spells, toId, toName, date)
  }

  return mergeReturns(spells).map(finalizeSpell)
}

function pushSpell(spells: OpenSpell[], id: string, name: string, date: string): OpenSpell {
  const s: OpenSpell = { clubId: id, club: displayClub(id, name), from: date, to: null, loans: [] }
  spells.push(s)
  return s
}

/**
 * Back-to-back spells at the same club: a return after a career break or free
 * agency, or a loan out of the academy renewed for a second season.
 */
function mergeReturns(spells: OpenSpell[]): OpenSpell[] {
  const out: OpenSpell[] = []
  for (const s of spells) {
    const prev = out[out.length - 1]
    if (prev && prev.clubId === s.clubId && !!prev.loan === !!s.loan) {
      prev.to = s.to
      prev.loans.push(...s.loans)
    } else out.push(s)
  }
  return out
}

function finalizeStint(s: OpenStint): CareerStint {
  return {
    clubId: s.clubId,
    club: s.club,
    from: yearOf(s.from),
    to: s.to ? yearOf(s.to) : null,
  }
}

function finalizeSpell(s: OpenSpell): CareerSpell {
  const spell: CareerSpell = { ...finalizeStint(s), loans: s.loans.map(finalizeStint) }
  if (s.loan) spell.loan = true
  return spell
}

export function rowCount(career: CareerSpell[]): number {
  return career.reduce((n, s) => n + 1 + s.loans.length, 0)
}

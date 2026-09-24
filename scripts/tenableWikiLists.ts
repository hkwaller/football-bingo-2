/**
 * Fetch + parse Wikipedia "list of … footballers" pages for Tenable open sets.
 * Used by buildTenableOpenSets.ts. Every list uses the same bullet format:
 *   *[[Target|Display]] – <small>[[Club F.C.|Club]], …</small> – 1992–97{{Cref2|…}}
 */
import type { TenableOpenSource } from '../src/data/tenable/types'

const UA = 'football-bingo-tenable/1.0 (build script)'
/** Trailing headings that can hold unrelated bullets (see-also links etc). */
const STOP_HEADINGS = /^(see also|references|notes|footnotes|external links|sources)$/i

export interface OpenMember {
  name: string
  aliases?: string[]
  detail?: string
}

export async function fetchRaw(page: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page.replace(/ /g, '_'))}&action=raw`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${page}: HTTP ${res.status}`)
  return res.text()
}

/** Strip {{templates}} (non-nested is enough here), <tags> and bold/italic quotes. */
function clean(s: string): string {
  let out = s
  for (let prev = ''; prev !== out; ) {
    prev = out
    out = out.replace(/\{\{[^{}]*\}\}/g, '')
  }
  return out
    .replace(/<[^>]+>/g, '')
    .replace(/'{2,}/g, '')
    .trim()
}

const LINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

/** Lines belonging to `section` (or the whole page), stopping at reference-y headings. */
function sectionLines(wikitext: string, section: string | undefined): string[] {
  const lines = wikitext.split('\n')
  const out: string[] = []
  let inside = !section
  let level = 0
  for (const line of lines) {
    const h = line.match(/^(={2,6})\s*(.*?)\s*\1\s*$/)
    if (h) {
      const lvl = h[1].length
      const title = clean(h[2])
      if (STOP_HEADINGS.test(title)) {
        if (inside && !section) break
        if (inside && lvl <= level) break
      }
      if (section) {
        if (inside && lvl <= level) break
        if (!inside && title.toLowerCase() === section.toLowerCase()) {
          inside = true
          level = lvl
        }
      }
      continue
    }
    if (inside) out.push(line)
  }
  if (section && !inside) throw new Error(`section "${section}" not found`)
  return out
}

export function parseMembers(wikitext: string, src: TenableOpenSource): OpenMember[] {
  const members: OpenMember[] = []
  for (const raw of sectionLines(wikitext, src.section)) {
    if (!raw.startsWith('*')) continue
    // Split into player / clubs / years on the en dash separators.
    const parts = raw.replace(/^\*+/, '').split(/\s+[–—-]\s+/)
    const playerPart = parts[0] ?? ''
    // Clubs are every link after the player; some lines separate clubs with a
    // dash instead of a comma, so don't assume they're all in parts[1].
    const clubPart = parts.slice(1).join(' ')

    const playerLink = [...playerPart.matchAll(LINK)][0]
    let name: string
    const aliases: string[] = []
    if (playerLink) {
      const target = playerLink[1].replace(/\s*\([^)]*\)\s*$/, '').trim()
      name = clean(playerLink[2] ?? playerLink[1]).replace(/\s*\([^)]*\)\s*$/, '')
      if (target && target !== name) aliases.push(target)
    } else {
      name = clean(playerPart).replace(/\s*\(.*$/, '')
    }
    if (!name) continue
    // `Maximiliano "Maxi" López` → name without the nickname, plus "Maxi López".
    const nick = name.match(/^(.*?)\s*["“]([^"”]+)["”]\s*(.*)$/)
    if (nick) {
      const [, first, nickname, rest] = nick
      name = [first, rest].filter(Boolean).join(' ')
      aliases.push([nickname, rest].filter(Boolean).join(' '))
    }

    const clubs = [...clubPart.matchAll(LINK)].map((m) => ({
      target: m[1].trim(),
      display: clean(m[2] ?? m[1]),
    }))
    if (src.club && !clubs.some((c) => c.target === src.club)) continue

    // A club-filtered list's years/clubs describe the whole league career, not
    // the club in question - only the unfiltered lists get a caption.
    const detail = src.club ? undefined : clubs.map((c) => c.display).join(' / ') || undefined
    members.push({ name, ...(aliases.length ? { aliases } : {}), ...(detail ? { detail } : {}) })
  }
  return members
}

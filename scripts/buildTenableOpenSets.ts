/**
 * Generates the COMPLETE member set for every 'open' Tenable category from the
 * Wikipedia list named in its `source` (e.g. "List of foreign Premier League
 * players" → Sweden). Hand-typed sets always miss people (Limpar, Schwarz…);
 * these lists are maintained to include everyone with at least one league game.
 *
 * Usage: npm run tenable:open   (also re-runs tenable:verify for portraits)
 *
 * Output: src/data/tenable/openSets.json - { questionId: [{ name, aliases?, detail? }] }
 * merged onto the curated answers at load time (src/data/tenable/openSets.ts).
 */
import * as fs from 'fs'
import * as path from 'path'
import { tenableQuestions } from '../src/data/tenable/questions'
import { normalize } from '../src/lib/tenable/normalize'
import { fetchRaw, parseMembers, type OpenMember } from './tenableWikiLists'

const OUT = path.join(__dirname, '..', 'src', 'data', 'tenable', 'openSets.json')

async function main() {
  const pages = new Map<string, Promise<string>>()
  const out: Record<string, OpenMember[]> = {}
  let failed = false

  for (const q of tenableQuestions) {
    if (q.kind !== 'open') continue
    if (!q.source) {
      console.warn(`⚠️  "${q.category}" is open but has no \`source\` - its set stays hand-curated`)
      continue
    }
    const src = q.source
    if (!pages.has(src.page)) pages.set(src.page, fetchRaw(src.page))
    try {
      const members = parseMembers(await pages.get(src.page)!, src)
      if (members.length < 10) throw new Error(`only ${members.length} members parsed`)
      out[q.id] = members
      const listed = new Set(members.flatMap((m) => [m.name, ...(m.aliases ?? [])].map(normalize)))
      const curatedMissing = q.answers.filter(
        (a) => ![a.name, ...(a.aliases ?? [])].some((n) => listed.has(normalize(n))),
      )
      console.log(`✅ ${q.id}: ${members.length} members from "${src.page}"`)
      if (curatedMissing.length) {
        // Usually a spelling difference (Andrew vs Andy); the merge keeps curated
        // answers either way, but check it isn't a wrong answer.
        console.log(
          `   curated but not on the list (spelling? wrong answer?): ${curatedMissing.map((a) => a.name).join(', ')}`,
        )
      }
    } catch (e) {
      failed = true
      console.error(`❌ ${q.id}: ${(e as Error).message}`)
    }
  }

  if (failed) {
    console.error('\nNot writing openSets.json - fix the errors above.')
    process.exit(1)
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
  console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`)
}

main()

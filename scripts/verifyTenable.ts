/**
 * Verifies the curated Tenable bank and backfills answer images/ids.
 *
 * Usage: npm run tenable:verify   (run `npm run tenable:index` first)
 *
 * For every answer it:
 *   - validates structure (exactly 10 answers, ranks 1..10 unique),
 *   - resolves name/aliases against scripts/output/tenableNameLookup.json to
 *     grab an image + transfermarkt id, and
 *   - WARNS on any name it can't resolve (likely a typo — fix the spelling or
 *     add an `aliases` entry). A miss only means "no portrait", not "unplayable".
 *
 * Output: src/data/tenable/enrichment.json — { "<questionId>#<rank>": {id,image} }
 * merged onto answers at load time (keeps questions.ts author-only).
 */
import * as fs from 'fs'
import * as path from 'path'
import { normalize } from '../src/lib/tenable/normalize'
import { tenableQuestions } from '../src/data/tenable/questions'

const LOOKUP_FILE = path.join(__dirname, 'output', 'tenableNameLookup.json')
const ENRICHMENT_OUT = path.join(__dirname, '..', 'src', 'data', 'tenable', 'enrichment.json')

type Lookup = Record<string, { id: string; image: string }>

function main() {
  if (!fs.existsSync(LOOKUP_FILE)) {
    console.error(`❌ Missing ${LOOKUP_FILE}. Run \`npm run tenable:index\` first.`)
    process.exit(1)
  }
  const lookup: Lookup = JSON.parse(fs.readFileSync(LOOKUP_FILE, 'utf-8'))

  const enrichment: Record<string, { id?: string; image?: string }> = {}
  const misses: string[] = []
  const structural: string[] = []
  let enriched = 0
  let total = 0

  const seenIds = new Set<string>()
  for (const q of tenableQuestions) {
    if (seenIds.has(q.id)) structural.push(`duplicate question id "${q.id}"`)
    seenIds.add(q.id)
    if (q.kind === 'open') {
      if (q.answers.length < 10) {
        structural.push(`"${q.category}" is open but has only ${q.answers.length} answers (need ≥10)`)
      }
    } else if (q.answers.length !== 10) {
      structural.push(`"${q.category}" has ${q.answers.length} answers (need exactly 10)`)
    }
    const ranks = new Set(q.answers.map((a) => a.rank))
    if (ranks.size !== q.answers.length) structural.push(`"${q.category}" has duplicate ranks`)

    for (const a of q.answers) {
      total++
      const keys = [a.name, ...(a.aliases ?? [])].map(normalize)
      let hit: { id: string; image: string } | undefined
      for (const k of keys) {
        const l = lookup[k]
        if (l && l.image) {
          hit = l
          break
        }
      }
      if (hit) {
        enrichment[`${q.id}#${a.rank}`] = { id: hit.id || undefined, image: hit.image }
        enriched++
      } else {
        misses.push(`"${q.category}" #${a.rank} "${a.name}"`)
      }
    }
  }

  fs.writeFileSync(ENRICHMENT_OUT, JSON.stringify(enrichment, null, 0))

  console.log(`\nTenable verify — ${tenableQuestions.length} categories, ${total} answers`)
  console.log(`✅ ${enriched}/${total} answers matched a portrait`)
  if (structural.length) {
    console.log(`\n❌ Structural problems:`)
    for (const s of structural) console.log(`   - ${s}`)
  }
  if (misses.length) {
    console.log(`\n⚠️  No portrait/match for ${misses.length} names (check spelling or add aliases):`)
    for (const m of misses) console.log(`   - ${m}`)
  }
  console.log(`\nWrote ${path.relative(process.cwd(), ENRICHMENT_OUT)}`)
  if (structural.length) process.exit(1)
}

main()

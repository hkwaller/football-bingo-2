import { normalize } from '@/lib/tenable/normalize'
import openSets from './openSets.json'
import type { TenableAnswer, TenableQuestion } from './types'

type OpenMember = Pick<TenableAnswer, 'name' | 'aliases' | 'detail'>

/**
 * Completes every 'open' category with its generated member set
 * (`npm run tenable:open`). Curated answers keep their rank, aliases and detail
 * (borrowing the generated caption if they have none) and stay first; each
 * generated member not already curated is appended with the next rank, so any
 * player on the source list is a valid answer.
 */
export function withOpenMembers(questions: TenableQuestion[]): TenableQuestion[] {
  const sets = openSets as Record<string, OpenMember[]>
  return questions.map((q) => {
    const members = q.kind === 'open' ? sets[q.id] : undefined
    if (!members) return q

    const keysOf = (a: OpenMember) => [a.name, ...(a.aliases ?? [])].map(normalize)
    const answers = [...q.answers]
    const byKey = new Map(answers.flatMap((a, i) => keysOf(a).map((k) => [k, i] as const)))
    let rank = Math.max(0, ...answers.map((a) => a.rank))
    for (const m of members) {
      const keys = keysOf(m)
      const curated = keys.map((k) => byKey.get(k)).find((i) => i !== undefined)
      if (curated !== undefined) {
        // Already curated: fill in a missing caption, keep everything else.
        const a = answers[curated]
        if (!a.detail && m.detail) answers[curated] = { ...a, detail: m.detail }
        continue
      }
      answers.push({ ...m, rank: ++rank })
      keys.forEach((k) => byKey.set(k, answers.length - 1))
    }
    return { ...q, answers }
  })
}

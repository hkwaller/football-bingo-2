import 'server-only'
import { enrichedFootballPlayers } from '@/data/players'
import { careerPlayers } from '@/data/careers'
import { famousLineups } from '@/data/famous11s'
import { tenableQuestions } from '@/data/tenable'
import type { PhotoAttribution } from '@/types/player'

export interface PhotoCredit {
  names: string[]
  imageUrl: string
  attribution: PhotoAttribution | null
}

/** Include resolved mode portraits, which may differ from the main player bank. */
export function getPhotoCredits(): PhotoCredit[] {
  const attributionByImage = new Map(
    enrichedFootballPlayers.flatMap((p) =>
      p.imageUrl && p.imageAttribution ? [[p.imageUrl, p.imageAttribution] as const] : [],
    ),
  )
  const rows = new Map<string, PhotoCredit>()
  function add(name: string, imageUrl?: string) {
    if (!imageUrl) return
    // A matching player name does not establish the licence of a different image.
    const attribution = attributionByImage.get(imageUrl) ?? null
    const key = attribution?.source || imageUrl
    const existing = rows.get(key)
    if (existing) {
      if (!existing.names.includes(name)) existing.names.push(name)
    } else {
      rows.set(key, { names: [name], imageUrl, attribution })
    }
  }

  for (const p of enrichedFootballPlayers) add(p.name, p.imageUrl)
  // Connections uses portraits from these same player and career banks.
  for (const p of careerPlayers) add(p.name, p.imageUrl)
  for (const lineup of famousLineups) {
    for (const slot of lineup.slots) add(slot.name, slot.image)
    if (lineup.manager) add(lineup.manager.name, lineup.manager.image)
  }
  for (const question of tenableQuestions) {
    for (const answer of question.answers) add(answer.name, answer.image)
  }
  return [...rows.values()].sort((a, b) => a.names[0].localeCompare(b.names[0]))
}

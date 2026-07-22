/**
 * Shared name normalization for Tenable.
 *
 * Used identically by the autocomplete name index (build + search) and by the
 * in-game answer matcher, so a player typed without special keys still matches
 * — "orjan" → "Ørjan", "muller" → "Müller", "zlatan ibrahimovic" → "Zlatan
 * Ibrahimović". Keep this the single source of truth: if the index and the
 * matcher ever fold differently, correct answers silently stop matching.
 */

/** Letters that NFD cannot decompose into ASCII + combining marks. */
const TRANSLITERATION: Record<string, string> = {
  ø: 'o',
  œ: 'oe',
  æ: 'ae',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  đ: 'd',
  ħ: 'h',
  ı: 'i',
  ĸ: 'k',
  ŋ: 'ng',
  ß: 'ss',
  ẞ: 'ss',
}

export function normalize(input: string): string {
  return (
    input
      .toLowerCase()
      // Decompose accents (é → e + ◌́) then strip the combining marks.
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      // Fold letters NFD leaves intact (ø, ł, ß…).
      .replace(/[øœæðþłđħıĸŋßẞ]/g, (ch) => TRANSLITERATION[ch] ?? ch)
      // Drop apostrophes/punctuation, collapse the rest to single spaces.
      .replace(/['’`]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
  )
}

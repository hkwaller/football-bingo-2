import type { ImageLoaderProps } from 'next/image'

const COMMONS_PREFIX = 'https://upload.wikimedia.org/wikipedia/commons/'
const RASTER_FILE = /\.(jpe?g|png|gif)$/i

/**
 * Commons only serves these thumbnail widths - any other value is a 400.
 * See https://w.wiki/GHai
 */
const COMMONS_THUMB_WIDTHS = [120, 250, 500]

/** Smallest allowed thumbnail that still covers `width`. */
export function commonsThumbWidth(width: number): number {
  return COMMONS_THUMB_WIDTHS.find((w) => w >= width) ?? COMMONS_THUMB_WIDTHS.at(-1)!
}

/**
 * Point a Commons URL at a thumbnail of the given width. Portraits render
 * between 42px and 174px, but the stored URLs are 500px thumbs - and for the
 * players stored as originals (no /thumb/ segment) the source file itself,
 * which runs to 130KB+. Anything that doesn't parse as a Commons raster URL is
 * returned untouched.
 */
export function wikimediaThumb(src: string, width: number): string {
  if (!src.startsWith(COMMONS_PREFIX)) return src
  const path = src.slice(COMMONS_PREFIX.length)
  const size = commonsThumbWidth(width)

  if (path.startsWith('thumb/')) {
    const cut = path.lastIndexOf('/')
    if (cut === -1) return src
    // Thumb filenames are "<width>px-<name>", sometimes with a generator prefix
    // such as "lossy-page1-" for multi-page sources.
    const thumb = /^(.*?)(\d+)px-(.+)$/.exec(path.slice(cut + 1))
    if (!thumb) return src
    return `${COMMONS_PREFIX}${path.slice(0, cut + 1)}${thumb[1]}${size}px-${thumb[3]}`
  }

  const [shard, subShard, file, ...extra] = path.split('/')
  if (!shard || !subShard || !file || extra.length > 0) return src
  if (!RASTER_FILE.test(file)) return src
  return `${COMMONS_PREFIX}thumb/${shard}/${subShard}/${file}/${size}px-${file}`
}

/**
 * next/image loader that resizes via the Commons thumbnailer instead of our own
 * optimizer, so the bytes shrink without routing every draw through a server
 * transform. Commons won't upscale past the source width, so callers must fall
 * back to the raw URL on error.
 */
export function wikimediaLoader({ src, width }: ImageLoaderProps): string {
  return wikimediaThumb(src, width)
}

'use client'

import Image from 'next/image'

type StickerProps = {
  name: string
  imageUrl?: string
  /** deterministic tilt in degrees */
  rotate?: number
  /** card width in px; omit to fill the parent width */
  width?: number
  /** name-bar font size in px */
  nameSize?: number
  className?: string
  /** highlight state — gold name bar for a winning line */
  win?: boolean
  /** show the red name bar under the portrait (default true) */
  showName?: boolean
}

/** A player portrait mounted like a collectible sticker: white card,
 *  slight tilt, red (or gold) name bar. The signature motif of the album.
 *  The portrait uses a square frame with the crop biased toward the head so
 *  wide broadcast headshots frame cleanly instead of zooming into the middle. */
export function Sticker({
  name,
  imageUrl,
  rotate = 0,
  width,
  nameSize = 12,
  className = '',
  win = false,
  showName = true,
}: StickerProps) {
  return (
    <div
      className={`shrink-0 rounded-[6px] bg-panel-white p-[6px] shadow-sticker ${showName ? 'pb-2' : ''} ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, width: width ? `${width}px` : undefined }}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[3px] bg-[#e7ddc8]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="160px"
            className="object-cover"
            style={{ objectPosition: '50% 16%' }}
            unoptimized
          />
        ) : (
          <svg viewBox="0 0 44 44" aria-hidden className="absolute inset-0 h-full w-full opacity-30">
            <circle cx="22" cy="16" r="9" fill="#262019" />
            <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#262019" />
          </svg>
        )}
      </div>
      {showName ? (
        <div
          className={`mt-[5px] truncate rounded-[2px] px-1 py-[3px] text-center font-display uppercase leading-tight tracking-[0.05em] ${
            win ? 'foil' : 'bg-red text-white'
          }`}
          style={{ fontSize: `${nameSize}px` }}
        >
          {name}
        </div>
      ) : null}
    </div>
  )
}

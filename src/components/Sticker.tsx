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
  /** highlight state - yellow name bar for a winning line */
  win?: boolean
  /** the currently-drawn player - a yellow outline ring */
  drawn?: boolean
  /** name-bar colorway (marquee alternation). default = deep-green bar + yellow text */
  variant?: 'green' | 'pink' | 'yellow'
  /** show the name bar under the portrait (default true) */
  showName?: boolean
}

const NAME_BAR: Record<'green' | 'pink' | 'yellow', string> = {
  green: 'bg-pitch-deep text-yellow',
  pink: 'bg-pink text-white',
  yellow: 'bg-yellow text-pitch-deep',
}

/** A player portrait mounted like a collectible sticker: white card,
 *  slight tilt, deep-green name bar with yellow Passion One text. The
 *  signature motif - reused on home, board, drawn panel and trivia. The
 *  portrait is square with the crop biased toward the head. */
export function Sticker({
  name,
  imageUrl,
  rotate = 0,
  width,
  nameSize = 12,
  className = '',
  win = false,
  drawn = false,
  variant = 'green',
  showName = true,
}: StickerProps) {
  return (
    <div
      className={`shrink-0 rounded-[8px] bg-white p-[6px] shadow-sticker ${showName ? 'pb-2' : ''} ${
        drawn ? 'outline outline-[3px] outline-offset-2 outline-yellow' : ''
      } ${className}`}
      style={{ transform: `rotate(${rotate}deg)`, width: width ? `${width}px` : undefined }}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[5px] bg-[#dceee2]">
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
          <svg
            viewBox="0 0 44 44"
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-25"
          >
            <circle cx="22" cy="16" r="9" fill="#0a3d20" />
            <path d="M4 44 C4 30 14 26 22 26 C30 26 40 30 40 44 Z" fill="#0a3d20" />
          </svg>
        )}
      </div>
      {showName ? (
        <div
          className={`mt-[5px] truncate rounded-[4px] px-1 py-[3px] text-center font-display font-bold uppercase leading-tight tracking-[0.04em] ${
            win ? NAME_BAR.yellow : NAME_BAR[variant]
          }`}
          style={{ fontSize: `${nameSize}px` }}
        >
          {name}
        </div>
      ) : null}
    </div>
  )
}

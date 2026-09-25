'use client'

import { useId, type CSSProperties } from 'react'

export type RoomGameMode = 'bingo' | 'trivia' | 'tenable' | 'famous11s'
export type RoomConnectingState = 'creating' | 'connecting' | 'reconnecting'

const MODE: Record<RoomGameMode, { name: string; light: string }> = {
  bingo: { name: 'Bingo', light: '#ffd62e' },
  trivia: { name: 'Trivia', light: '#ff5b45' },
  tenable: { name: 'Tenable', light: '#6fd3f2' },
  famous11s: { name: 'Famous 11s', light: '#ffd62e' },
}

const COPY: Record<RoomConnectingState, { title: string; status: string }> = {
  creating: { title: 'Opening the tunnel', status: 'Creating room…' },
  connecting: { title: 'Walking up the tunnel', status: 'Connecting to room…' },
  reconnecting: { title: 'Back up the tunnel', status: 'Lost the connection - reconnecting…' },
}

// One-point perspective: the far opening is the tunnel mouth scaled to 20%
// around this vanishing point, so ribs animate by scale alone.
const MOUTH = 'M20 260 L20 108 Q20 30 200 30 Q380 30 380 108 L380 260'
const RIB_DELAYS = [0, -0.48, -0.96, -1.44, -1.92]
const RIB_STATIC_SCALES = [0.3, 0.42, 0.56, 0.72, 0.9]

/**
 * Waiting screen for multiplayer rooms: the players' walk up the tunnel toward
 * the floodlit pitch, lit in the game's colour. The wait is real (Liveblocks
 * connecting), so it only fades in after a beat and never delays the room.
 */
export function RoomConnecting({
  mode,
  state = 'connecting',
}: {
  mode: RoomGameMode
  state?: RoomConnectingState
}) {
  const uid = useId().replace(/:/g, '')
  const { name, light } = MODE[mode]
  const { title, status } = COPY[state]
  const id = (s: string) => `${uid}-${s}`

  return (
    <div
      role="status"
      aria-live="polite"
      className="room-connecting flex min-h-[62vh] flex-col items-center justify-center px-5 py-10 text-center"
    >
      <svg
        viewBox="0 0 400 264"
        className="w-[min(380px,82vw)] overflow-visible"
        aria-hidden
        focusable="false"
      >
        <defs>
          <clipPath id={id('mouth')}>
            <path d={`${MOUTH} Z`} />
          </clipPath>
          <clipPath id={id('far')}>
            <path
              d={`${MOUTH} Z`}
              transform="translate(200 122.5) scale(0.2) translate(-200 -122.5)"
            />
          </clipPath>
          <radialGradient id={id('spill')} cx="200" cy="128" r="190" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={light} stopOpacity="0.32" />
            <stop offset="0.55" stopColor={light} stopOpacity="0.06" />
            <stop offset="1" stopColor={light} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('bloom')} cx="200" cy="120" r="70" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fffdf6" stopOpacity="0.95" />
            <stop offset="0.35" stopColor={light} stopOpacity="0.55" />
            <stop offset="1" stopColor={light} stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={id('sky')}
            x1="0"
            y1="104"
            x2="0"
            y2="150"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#fffdf6" />
            <stop offset="0.6" stopColor={light} />
          </linearGradient>
        </defs>

        {/* Tunnel interior */}
        <path d={`${MOUTH} Z`} fill="#0a2417" />
        <g clipPath={`url(#${id('mouth')})`}>
          {/* Floor, converging on the pitch */}
          <path d="M20 264 L380 264 L236 150 L164 150 Z" fill="#0d3321" />
          <path
            d="M200 150 L200 264"
            stroke="#f5f0e1"
            strokeOpacity="0.14"
            strokeWidth="2"
            strokeDasharray="6 9"
          />
          <rect x="0" y="0" width="400" height="264" fill={`url(#${id('spill')})`} />

          {/* Ribs rushing past as you walk */}
          {RIB_DELAYS.map((d, i) => (
            <path
              key={i}
              d={MOUTH}
              className="tunnel-rib"
              style={
                {
                  animationDelay: `${d}s`,
                  '--rib-s': RIB_STATIC_SCALES[i],
                } as CSSProperties
              }
              fill="none"
              stroke="#f5f0e1"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          ))}

          {/* The pitch at the far end, drawing slowly closer */}
          <g className="tunnel-approach">
            <circle
              cx="200"
              cy="120"
              r="70"
              fill={`url(#${id('bloom')})`}
              className="tunnel-glow"
            />
            <g clipPath={`url(#${id('far')})`}>
              <rect x="150" y="100" width="100" height="52" fill={`url(#${id('sky')})`} />
              {/* Stands */}
              <rect x="150" y="124" width="100" height="10" fill="#0a2417" fillOpacity="0.35" />
              {/* Mown stripes */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <rect
                  key={i}
                  x={150 + i * 12.5}
                  y="134"
                  width="12.5"
                  height="18"
                  fill={i % 2 ? '#15603a' : '#1c7446'}
                />
              ))}
            </g>
            {/* Floodlights */}
            <circle cx="178" cy="112" r="2" fill="#fffdf6" className="tunnel-flood" />
            <circle
              cx="222"
              cy="112"
              r="2"
              fill="#fffdf6"
              className="tunnel-flood"
              style={{ animationDelay: '-1.1s' }}
            />
          </g>
        </g>

        {/* Chalk touchline the tunnel opens onto */}
        <path
          d="M-30 262 H430"
          stroke="#f5f0e1"
          strokeOpacity="0.55"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Tunnel mouth */}
        <path d={MOUTH} fill="none" stroke="#0a2417" strokeWidth="10" strokeLinejoin="round" />
        <path
          d={MOUTH}
          fill="none"
          stroke="#f5f0e1"
          strokeOpacity="0.22"
          strokeWidth="2"
          strokeLinejoin="round"
          transform="translate(200 145) scale(0.965) translate(-200 -145)"
        />
      </svg>

      <h1 className="mt-7 text-balance font-display text-[44px] font-black uppercase leading-[0.88] text-on-green md:text-[60px]">
        {title}
      </h1>
      <p className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 font-mono text-[12.5px] font-semibold uppercase tracking-[0.1em] text-on-green-dim">
        <span
          aria-hidden
          className="inline-block size-2.5 rounded-[2px] border-[1.5px] border-card-ink"
          style={{ backgroundColor: light }}
        />
        <span className="text-on-green">{name}</span>
        <span className="h-3 w-px bg-surface/30" aria-hidden />
        <span className="sr-only">, </span>
        {status}
      </p>
    </div>
  )
}

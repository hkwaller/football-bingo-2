import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

export const alt = `${SITE_NAME} - Know football? Prove it.`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// On-brand "Prime Time Green" game-show card. Satori: flexbox only, no grid.
export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 88px',
        background: 'linear-gradient(135deg, #15603a 0%, #0e4a2c 55%, #093820 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignSelf: 'flex-start',
          background: 'rgba(10,36,23,0.22)',
          color: '#ffffff',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase',
          padding: '12px 22px',
          borderRadius: 999,
        }}
      >
        The football knowledge game
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: 44,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: '#ffffff',
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          Know football?
        </div>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            marginTop: 18,
            background: '#ffd62e',
            color: '#093820',
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 1,
            textTransform: 'uppercase',
            padding: '4px 26px',
            transform: 'rotate(-1.5deg)',
          }}
        >
          Prove it.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: 52,
          color: '#ddebe1',
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        ⚽ Bingo · Trivia · Tenable - solo or a full room
      </div>
    </div>,
    { ...size },
  )
}

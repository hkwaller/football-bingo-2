import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Brand mark: yellow ball-in-square on pitch green.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d7a3a',
          color: '#ffe23a',
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        ⚽
      </div>
    ),
    { ...size },
  )
}

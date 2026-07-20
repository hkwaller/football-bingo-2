'use client'

/**
 * Ambient stadium-floodlight glints: a few fixed dots scattered at the
 * viewport edges, twinkling out of sync. Purely decorative - sits behind
 * all content and never intercepts pointer events. Animation is disabled
 * under prefers-reduced-motion (see globals.css).
 */
const DOTS = [
  { top: '18%', left: '4%', size: 12, color: 'var(--yellow)', delay: '0s' },
  { top: '46%', right: '5%', size: 10, color: 'var(--pink)', delay: '0.5s' },
  { top: '72%', left: '7%', size: 11, color: 'var(--sky)', delay: '1s' },
  { top: '30%', right: '12%', size: 14, color: 'var(--sky)', delay: '0.8s' },
  { top: '86%', right: '9%', size: 12, color: 'var(--yellow)', delay: '0.3s' },
] as const

export function TwinkleDots() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {DOTS.map((d, i) => (
        <span
          key={i}
          className="twinkle-dot animate-twinkle"
          style={{
            top: d.top,
            left: 'left' in d ? d.left : undefined,
            right: 'right' in d ? d.right : undefined,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}

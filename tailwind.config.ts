import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* ── Prime Time Green palette ──────────────────────────────────── */
        pitch: {
          DEFAULT: '#0d7a3a', // page base / mid gradient stop
          bright: '#1fae5a', // gradient top-left
          deep: '#06592a', // gradient bottom / dark text on yellow / name bars
          light: '#ffffff', // legacy alias → white cards
          lighter: '#ffffff',
        },
        card: {
          ink: '#0a3d20', // headings / borders on white cards
          muted: '#3c6e4d', // secondary text on cards
          'muted-2': '#6f9c7f', // tertiary text on cards
          tint: '#ecf7ef', // inactive fills / input backgrounds
        },
        'green-go': '#22c55e', // correct / active / Club
        yellow: {
          DEFAULT: '#ffe23a', // THE action color
          deep: '#ffd000',
        },
        pink: {
          DEFAULT: '#ff4d8d', // hot pop
          deep: '#e63a76',
        },
        sky: '#4de1ff', // cool pop
        'live-red': '#e0301e', // pulsing LIVE badge
        'on-green': {
          DEFAULT: '#ffffff',
          soft: '#d7f2df',
          dim: '#b9e6c8',
        },

        /* ── Legacy Sticker-Album names, remapped onto Prime Time Green ─── */
        paper: '#0d7a3a',
        panel: {
          DEFAULT: '#ffffff',
          white: '#ffffff',
        },
        ink: {
          DEFAULT: '#0a3d20',
          soft: '#3c6e4d',
        },
        muted: {
          DEFAULT: '#3c6e4d',
          foreground: 'var(--muted-foreground)',
        },
        green: {
          DEFAULT: '#0a3d20',
          deep: '#06592a',
        },
        red: {
          DEFAULT: '#ff4d8d',
          deep: '#e63a76',
        },
        cream: {
          DEFAULT: '#ffffff',
          dim: '#b9e6c8',
        },
        nation: '#4de1ff',
        foil: '#ffe23a',
        gold: '#ffe23a',
        link: {
          DEFAULT: '#ffe23a',
          hover: '#fff07a',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },

        /* ── Older Floodlit aliases, remapped ──────────────────────────── */
        chalk: {
          DEFAULT: 'var(--ink)',
          dim: 'var(--muted)',
        },
        turf: {
          DEFAULT: 'var(--yellow)',
          deep: 'var(--yellow-deep)',
        },
        flare: 'var(--pink)',

        /* shadcn plumbing */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: 'var(--destructive)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      boxShadow: {
        /* Hard offset shadows, no blur - the Prime Time language */
        soft: '0 8px 0 rgba(0,0,0,0.22)',
        sticker: '0 5px 0 rgba(0,0,0,0.2)',
        'sticker-lg': '0 8px 0 rgba(0,0,0,0.22)',
        panel: '0 8px 0 rgba(0,0,0,0.22)',
        hard: '0 8px 0 rgba(0,0,0,0.22)',
        'hard-lg': '0 10px 0 rgba(0,0,0,0.22)',
        'hard-sm': '0 4px 0 rgba(0,0,0,0.22)',
        btn: '0 6px 0 rgba(0,0,0,0.28)',
        'btn-sm': '0 4px 0 rgba(0,0,0,0.25)',
        chip: '0 3px 0 rgba(0,0,0,0.2)',
        'foil-ring': 'inset 0 0 0 3px rgba(255,255,255,0.25)',
        // Legacy aliases so unconverted components degrade gracefully
        'glow-turf': '0 6px 0 rgba(0,0,0,0.25)',
        'glow-gold': '0 6px 0 rgba(0,0,0,0.25)',
        'brutal-sm': '0 4px 0 rgba(0,0,0,0.22)',
        brutal: '0 6px 0 rgba(0,0,0,0.25)',
        'brutal-lg': '0 10px 0 rgba(0,0,0,0.22)',
      },
      backgroundImage: {
        foil: 'linear-gradient(90deg,#ffe23a,#ff4d8d)',
        stage: 'linear-gradient(165deg, #1fae5a 0%, #0d7a3a 60%, #06592a 100%)',
        'paper-dots': 'none',
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        twinkle: 'twinkle 2.6s ease-in-out infinite',
        bob: 'bob 4s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '0.25', transform: 'scale(0.55)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-9px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

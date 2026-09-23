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
          DEFAULT: '#0e4a2c', // page base / mid gradient stop
          bright: '#15603a', // gradient top-left
          deep: '#093820', // gradient bottom / dark text on yellow / name bars
          light: '#f5f0e1', // legacy alias → paper cards
          lighter: '#f5f0e1',
        },
        card: {
          ink: '#0a2417', // headings / borders on white cards
          muted: '#3d5a48', // secondary text on cards
          'muted-2': '#6b8575', // tertiary text on cards
          tint: '#e9e1c9', // inactive fills / input backgrounds
        },
        'green-go': '#3ddc84', // correct / active / Club
        yellow: {
          DEFAULT: '#ffd62e', // THE action color
          deep: '#f5c400',
        },
        pink: {
          DEFAULT: '#ff5b45', // hot pop
          deep: '#e8452f',
        },
        sky: '#6fd3f2', // cool pop (Tenable, Nation)
        coral: {
          DEFAULT: '#ff5b45', // Trivia, wrong answers, LIVE
          deep: '#e8452f',
        },
        surface: {
          DEFAULT: '#f5f0e1', // paper cards
          2: '#e9e1c9', // inactive fills, trait chips
          hi: '#fffdf6', // sticker card, inputs
        },
        'live-red': '#e8412c', // pulsing LIVE badge
        'on-green': {
          DEFAULT: '#ffffff',
          soft: '#ddebe1',
          dim: '#b7d3c1',
        },

        /* ── Legacy Sticker-Album names, remapped onto Prime Time Green ─── */
        paper: '#0e4a2c',
        panel: {
          DEFAULT: '#f5f0e1',
          white: '#f5f0e1',
        },
        ink: {
          DEFAULT: '#0a2417',
          soft: '#3d5a48',
        },
        muted: {
          DEFAULT: '#3d5a48',
          foreground: 'var(--muted-foreground)',
        },
        green: {
          DEFAULT: '#0a2417',
          deep: '#093820',
        },
        red: {
          DEFAULT: '#ff5b45',
          deep: '#e8452f',
        },
        cream: {
          DEFAULT: '#f5f0e1',
          dim: '#b7d3c1',
        },
        nation: '#6fd3f2',
        foil: '#ffd62e',
        gold: '#ffd62e',
        link: {
          DEFAULT: '#ffd62e',
          hover: '#ffe680',
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
        /* Hard offset ink shadows, no blur - the Matchday language */
        soft: '0 8px 0 #0a2417',
        sticker: '0 5px 0 #0a2417',
        'sticker-lg': '0 8px 0 #0a2417',
        panel: '0 8px 0 #0a2417',
        hard: '0 8px 0 #0a2417',
        'hard-lg': '0 10px 0 #0a2417',
        'hard-sm': '0 4px 0 #0a2417',
        btn: '0 6px 0 #0a2417',
        'btn-sm': '0 4px 0 #0a2417',
        chip: '0 3px 0 #0a2417',
        'foil-ring': 'inset 0 0 0 3px rgba(255,255,255,0.25)',
        // Legacy aliases so unconverted components degrade gracefully
        'glow-turf': '0 6px 0 #0a2417',
        'glow-gold': '0 6px 0 #0a2417',
        'brutal-sm': '0 4px 0 #0a2417',
        brutal: '0 6px 0 #0a2417',
        'brutal-lg': '0 10px 0 #0a2417',
      },
      backgroundImage: {
        foil: 'linear-gradient(90deg,#ffd62e,#ff5b45)',
        stage: 'linear-gradient(180deg, #0e4a2c 0%, #093820 100%)',
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

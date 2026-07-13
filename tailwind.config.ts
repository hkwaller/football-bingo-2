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
        /* ── Sticker Album palette ─────────────────────────────────────── */
        paper: '#ece0c8',
        panel: {
          DEFAULT: '#f7efdd',
          white: '#ffffff',
        },
        ink: {
          DEFAULT: '#262019',
          soft: '#4c4638',
        },
        muted: {
          DEFAULT: '#6b5f4c',
          foreground: 'var(--muted-foreground)',
        },
        green: {
          DEFAULT: '#1d3b2a',
          deep: '#16301f',
        },
        red: {
          DEFAULT: '#d64533',
          deep: '#b8382a',
        },
        cream: {
          DEFAULT: '#f2e8d5',
          dim: '#c9b98f',
        },
        nation: '#14264f',
        foil: '#b8862c',
        gold: '#b8862c',
        link: {
          DEFAULT: '#e8c15a',
          hover: '#f3d78a',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },

        /* ── Legacy Floodlit names, remapped ───────────────────────────── */
        pitch: {
          dark: 'var(--paper)',
          DEFAULT: 'var(--panel-white)',
          light: 'var(--panel)',
          lighter: '#fbf5e8',
        },
        chalk: {
          DEFAULT: 'var(--ink)',
          dim: 'var(--muted)',
        },
        turf: {
          DEFAULT: 'var(--red)',
          deep: 'var(--red-deep)',
        },
        flare: 'var(--red)',

        /* shadcn plumbing */
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
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
        soft: '0 10px 24px -18px rgba(0,0,0,0.5)',
        sticker: '0 6px 14px -6px rgba(0,0,0,0.4)',
        'sticker-lg': '0 8px 18px -8px rgba(0,0,0,0.45)',
        panel: '0 10px 24px -18px rgba(0,0,0,0.5)',
        'foil-ring': 'inset 0 0 0 3px #b8862c',
        // Legacy aliases so unconverted components degrade gracefully
        'glow-turf': '0 8px 18px -8px rgba(214,69,51,0.45)',
        'glow-gold': '0 6px 14px -6px rgba(184,134,44,0.5)',
        'brutal-sm': '0 4px 10px -4px rgba(0,0,0,0.35)',
        brutal: '0 6px 14px -6px rgba(0,0,0,0.4)',
        'brutal-lg': '0 10px 24px -12px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        foil: 'linear-gradient(130deg,#f6d87c,#e8b93e 45%,#fdf0c0 60%,#d9a730)',
        'paper-dots': 'radial-gradient(rgba(120,90,40,0.06) 1px, transparent 1px)',
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
}

export default config

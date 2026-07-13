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
        pitch: {
          dark: '#070d09',
          DEFAULT: '#0d1510',
          light: '#141f17',
          lighter: '#1c2b20',
        },
        chalk: {
          DEFAULT: '#e9f2ec',
          dim: '#8fa697',
        },
        turf: {
          DEFAULT: '#3ce97e',
          deep: '#14b85c',
        },
        gold: '#f4c65d',
        flare: '#ff6b5e',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        fb: {
          lime: 'var(--fb-accent-lime)',
          magenta: 'var(--fb-accent-magenta)',
          cyan: 'var(--fb-accent-cyan)',
          yellow: 'var(--fb-accent-yellow)',
          mint: 'var(--fb-accent-mint)',
        },
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
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
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
        soft: '0 1px 2px rgba(0,0,0,0.35), 0 12px 32px -12px rgba(0,0,0,0.55)',
        'glow-turf': '0 0 0 1px rgba(60,233,126,0.4), 0 0 28px -6px rgba(60,233,126,0.5)',
        'glow-gold': '0 0 0 1px rgba(244,198,93,0.45), 0 0 30px -6px rgba(244,198,93,0.55)',
        // Legacy aliases so unconverted components degrade gracefully
        'brutal-sm': '0 4px 12px -4px rgba(0,0,0,0.5)',
        brutal: '0 8px 24px -8px rgba(0,0,0,0.55)',
        'brutal-lg': '0 16px 40px -12px rgba(0,0,0,0.6)',
        'brutal-lime': '0 0 24px -6px rgba(60,233,126,0.45)',
        'brutal-magenta': '0 0 24px -6px rgba(244,198,93,0.45)',
        'brutal-cyan': '0 0 24px -6px rgba(159,216,255,0.45)',
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

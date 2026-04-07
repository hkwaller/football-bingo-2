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
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        pitch: {
          dark: '#050505',
          DEFAULT: '#09090b',
          light: '#18181b',
        },
        chalk: '#f4f4f5',
        line: '#e9ecef',
        fb: {
          lime: 'var(--fb-accent-lime)',
          magenta: 'var(--fb-accent-magenta)',
          cyan: 'var(--fb-accent-cyan)',
          yellow: 'var(--fb-accent-yellow)',
          mint: 'var(--fb-accent-mint)',
        },
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'brutal-lime': '4px 4px 0px 0px var(--fb-accent-lime)',
        'brutal-magenta': '4px 4px 0px 0px var(--fb-accent-magenta)',
        'brutal-cyan': '4px 4px 0px 0px var(--fb-accent-cyan)',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}

export default config

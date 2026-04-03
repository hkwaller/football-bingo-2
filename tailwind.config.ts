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
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        pitch: {
          dark: '#0a0f14',
          DEFAULT: '#121a22',
          light: '#1e2d3d',
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
    },
  },
  plugins: [],
}

export default config

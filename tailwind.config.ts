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
      },
      colors: {
        pitch: {
          dark: '#0d2818',
          DEFAULT: '#1a4d2e',
          light: '#2d6a4f',
        },
        chalk: '#f4f1de',
        line: '#e9ecef',
      },
    },
  },
  plugins: [],
}

export default config

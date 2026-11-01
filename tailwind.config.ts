import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: 'var(--navy-900)',
          950: 'var(--navy-950)',
        },
        blue: {
          500: 'var(--blue-500)',
          600: 'var(--blue-600)',
          700: 'var(--blue-700)',
        },
        sky: {
          400: 'var(--sky-400)',
        },
        ice: {
          100: 'var(--ice-100)',
        },
        pearl: {
          50: 'var(--pearl-50)',
        },
        ink: {
          500: 'var(--ink-500)',
          900: 'var(--ink-900)',
        },
        line: 'var(--line)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      backgroundImage: {
        'grad-primary': 'var(--grad-primary)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        'sm-token': '10px',
        'input-token': '16px',
        'card-token': '24px',
        'panel-token': '32px',
        'pill-token': '999px',
      },
      boxShadow: {
        'soft-token': 'var(--shadow-soft)',
        'lifted-token': 'var(--shadow-lifted)',
        'glow-token': 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};

export default config;

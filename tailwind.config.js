/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    fontFamily: {
      sans: [
        'Plus Jakarta Sans',
        'Noto Sans SC',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'sans-serif',
      ],
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        warm: '0 4px 24px -4px rgba(0, 108, 184, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 8px 32px -8px rgba(0, 108, 184, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};

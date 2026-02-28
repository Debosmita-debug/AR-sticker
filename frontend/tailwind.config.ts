import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom AR Sticker theme
        primary: '#7C3AFF', // Purple accent
        secondary: '#00D4FF', // Cyan accent
        dark: '#0A0B14', // Dark background
        'dark-lighter': '#15172A', // Slightly lighter dark
        'dark-text': '#F0F2FF', // Light text
        'dark-secondary': '#8B91B8', // Secondary text
        'dark-tertiary': '#4A5080', // Tertiary text
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        heading: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        btn: '8px',
        lg: '12px',
        xl: '16px',
      },
      spacing: {
        gutter: '1.5rem',
      },
      animation: {
        'spin-reverse': 'spin-reverse 1.5s linear infinite',
        'pulse-ring': 'pulse-ring 1s ease-in-out infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'corner-pulse': 'corner-pulse 1s ease-in-out infinite',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        'pulse-ring': {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '1',
          },
          '100%': {
            transform: 'scale(1.2)',
            opacity: '0',
          },
        },
        'scan': {
          '0%': { top: '-20%' },
          '50%': { top: '50%' },
          '100%': { top: '120%' },
        },
        'corner-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'blink': {
          '0%, 50%, 100%': { opacity: '1' },
          '25%, 75%': { opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;

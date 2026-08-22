import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
      },
      colors: {
        bg: '#FAFBFA',
        surface: '#FFFFFF',
        'surface-soft': '#F1F7F5',
        ink: '#123331',
        slate: '#4B5E5B',
        muted: '#8A9C99',
        hairline: '#E3ECE9',
        teal: '#0E7C74',
        'teal-deep': '#0A5A54',
        'teal-soft': '#E7F4F1',
        success: '#0F9D6C',
        warning: '#B4780C',
        error: '#D64545',
      },
      spacing: {
        px: '1px',
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        full: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(18, 51, 49, 0.05)',
        sm: '0 1px 3px rgba(18, 51, 49, 0.06)',
        md: '0 4px 12px rgba(18, 51, 49, 0.08)',
        lg: '0 8px 20px rgba(18, 51, 49, 0.10)',
      },
      fontSize: {
        caption: ['12px', { lineHeight: '1.5', fontWeight: '500' }],
        small: ['13px', { lineHeight: '1.6', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.6' }],
        h2: ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        h1: ['22px', { lineHeight: '1.5', fontWeight: '600' }],
        display: ['30px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        160: '160ms',
      },
      outline: {
        teal: '3px solid rgba(14, 124, 116, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;

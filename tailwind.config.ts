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
        // Senebiclabs brand palette
        bg: '#FAFBFC',
        surface: '#FFFFFF',
        ink: '#10233B',
        slate: '#47566A',
        muted: '#8492A2',
        hairline: '#E3E8EC',
        accent: '#0E7C74',
        'accent-deep': '#0B5E58',
        success: '#0E9F6E',
        warning: '#C2860B',
        error: '#DC2626',
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
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '14px',
        full: '999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16, 35, 59, 0.06)',
        sm: '0 2px 4px rgba(16, 35, 59, 0.08)',
        md: '0 4px 8px rgba(16, 35, 59, 0.1)',
        lg: '0 8px 16px rgba(16, 35, 59, 0.12)',
        none: 'none',
      },
      fontSize: {
        caption: ['12px', { lineHeight: '1.5' }],
        small: ['13px', { lineHeight: '1.6' }],
        body: ['15px', { lineHeight: '1.6' }],
        h2: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        h1: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        display: ['30px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
      },
    },
  },
  plugins: [],
};

export default config;

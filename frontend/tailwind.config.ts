import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IndiaMART Primary Brand
        'im-blue': '#2E3192',
        'im-blue-light': '#3A3DB0',
        'im-blue-dark': '#1E2170',

        // CTA & Action Colors
        'im-teal': '#00A699',
        'im-teal-dark': '#007A6E',
        'im-teal-light': '#00C4B4',

        // Accent Colors
        'im-indigo': '#4F5EFF',
        'im-indigo-light': '#6975F9',
        'im-red': '#F63A0D',
        'im-yellow': '#EDD200',
        'im-google-blue': '#4285F4',

        // Backgrounds
        'im-bg': '#F3F3F3',
        'im-bg-white': '#FFFFFF',
        'im-bg-footer': '#F8F8F8',
        'im-bg-highlight': '#EBEDFD',
        'im-bg-input': '#F5F5F5',
        'im-bg-form': '#F8FAFB',
        'im-bg-error': '#FFEAEA',

        // Text Colors
        'im-text': '#000000',
        'im-text-heading': '#323232',
        'im-text-secondary': '#333333',
        'im-text-muted': '#696969',
        'im-text-disabled': '#CCCCCC',

        // Borders
        'im-border': '#CCCCCC',
        'im-divider': '#BBBBBB',
        'im-border-highlight': '#D3D8FD',
      },
      fontFamily: {
        'roboto': ['Roboto', 'Arial', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'hero': ['37px', { lineHeight: '44px', fontWeight: '400' }],
        'section-h2': ['28px', { lineHeight: '36px', fontWeight: '500' }],
        'cta': ['22px', { lineHeight: '28px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'nav': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'badge': ['9px', { lineHeight: '12px', fontWeight: '400' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'typing': 'typing 1.5s steps(30) forwards',
        'blink': 'blink 0.8s infinite',
        'progress': 'progress 2s ease-in-out forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

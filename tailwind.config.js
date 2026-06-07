/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sabi-dark':   '#0A2E1A',
        'sabi-card':   '#0F3D22',
        'sabi-border': '#1A5C30',
        'sabi-green':  '#4CAF72',
        'sabi-gold':   '#F5C842',
        'sabi-muted':  '#7AAE90',
        'sabi-deep':   '#061A0E',
        'beauty-bg':      '#fdf5f5',
        'beauty-card':    '#fff0f0',
        'beauty-primary': '#b85c5c',
        'beauty-accent':  '#c97a7a',
        'beauty-text':    '#2d1b1b',
        'beauty-muted':   '#9a7070',
        'beauty-border':  '#eed5d5',
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.4s ease-out',
        'pulse-dot': 'pulseDot 1.5s infinite',
        'spin-slow': 'spin 0.75s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
};

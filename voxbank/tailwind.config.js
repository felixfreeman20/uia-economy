/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vox: {
          black: '#0a0a0f',
          darker: '#0d0d15',
          dark: '#12121e',
          panel: '#161625',
          border: '#1e1e35',
          gold: '#c9a84c',
          'gold-light': '#e8c96a',
          'gold-dark': '#9a7a2e',
          cyan: '#00d4ff',
          red: '#ff3355',
          green: '#00ff88',
          purple: '#7c3aed',
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #c9a84c, #e8c96a, #c9a84c)',
        'dark-gradient': 'linear-gradient(180deg, #0a0a0f 0%, #12121e 100%)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.6)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'ticker': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}

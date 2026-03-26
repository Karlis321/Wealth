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
        surface: {
          DEFAULT: '#07070f',
          card: '#0c0c1a',
          hover: '#111122',
          border: '#181830',
          highlight: '#1e1e3a',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dim: '#1e1b4b',
          muted: 'rgba(99,102,241,0.12)',
        },
        up: '#16a34a',
        down: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99,102,241,0.15)',
        'glow-md': '0 0 24px rgba(99,102,241,0.2)',
        'glow-up': '0 0 16px rgba(34,197,94,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.35)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.5), 0 16px 40px rgba(0,0,0,0.4), 0 0 40px rgba(99,102,241,0.06)',
        'modal': '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08) inset',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

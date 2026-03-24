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
          DEFAULT: '#0d0d14',
          card: '#13131f',
          hover: '#1a1a2e',
          border: '#1e1e35',
        },
        accent: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dim: '#312e81',
        },
        up: '#22c55e',
        down: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

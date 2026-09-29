/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a5b8fc',
          400: '#8090f8',
          500: '#6366f1',
          600: '#1e3a8a',
          700: '#1e2d6b',
          800: '#1a2355',
          900: '#151d45',
          950: '#0f1530',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

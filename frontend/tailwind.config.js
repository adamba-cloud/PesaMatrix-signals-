/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',
          darker: '#070A12',
          card: '#111827',
          card2: '#1a2235',
          border: '#1f2d42',
          primary: '#10B981',
          primaryDark: '#059669',
          primaryLight: '#34D399',
          accent: '#3B82F6',
          muted: '#6B7280',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

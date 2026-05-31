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
          card: '#161C2A',
          border: '#242F41',
          primary: '#10B981', // Safaricom Live Green Hex
          accent: '#3B82F6'
        }
      }
    },
  },
  plugins: [],
}

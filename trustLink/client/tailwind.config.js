/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trustNeutral: '#F8F9FA',
        trustDark: '#1A1D20',
        trustMuted: '#6C757D',
        trustGreen: {
          DEFAULT: '#00C853',
          hover: '#00B248',
          light: '#D1E7DD',
          accent: '#00E676'
        },
        trustYellow: '#FFF3CD',
        trustBlue: '#CFF4FC',
      }
    },
  },
  plugins: [],
}
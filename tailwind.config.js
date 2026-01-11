/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Modern Dark Mode Palette
        background: '#0a0a0a', // Very dark grey/black
        surface: '#171717',    // Slightly lighter for cards/surfaces
        primary: '#3b82f6',    // Blue accent
        secondary: '#a855f7',  // Purple accent
        text: '#ededed',       // Off-white text
        muted: '#a3a3a3',      // Muted text
        border: '#262626',     // Dark borders
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], // Geometric sans-serif
      },
    },
  },
  plugins: [],
}

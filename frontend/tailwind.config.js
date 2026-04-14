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
          // Dark navy from the hero section
          900: '#111418',
          800: '#1a2030',
          700: '#1e2840',
          600: '#1e3050',
          500: '#1e3a5f',
          // Sage green from content sections
          sage: '#b8c4b0',
          'sage-light': '#d4ddd0',
          'sage-dark': '#8fa388',
          // Deep crimson red CTA buttons
          red: '#8b1414',
          'red-hover': '#6e1010',
          'red-light': '#a31818',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

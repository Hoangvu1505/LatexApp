/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        latex: {
          dark: '#1e1e2e',
          editor: '#181825',
          sidebar: '#11111b',
          border: '#313244',
          accent: '#89b4fa',
          hover: '#45475a'
        }
      }
    },
  },
  plugins: [],
}


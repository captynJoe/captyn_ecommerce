/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // 👈 Enables manual dark mode via 'dark' class
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

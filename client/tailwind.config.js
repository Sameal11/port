/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // The UI uses fine-grained translucency (e.g. border-white/8, bg-white/3).
      // Tailwind 3 only ships steps of 5, so without these the classes were
      // silently dropped and borders fell back to the default light grey.
      opacity: {
        1: '0.01',
        2: '0.02',
        3: '0.03',
        6: '0.06',
        8: '0.08',
        12: '0.12',
        42: '0.42',
        62: '0.62',
        68: '0.68',
        72: '0.72',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

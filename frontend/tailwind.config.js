/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        base:    '#0F172A',
        card:    '#1E293B',
        border:  '#334155',
        muted:   '#475569',
        text:    '#E2E8F0',
        primary: '#3B82F6',
        success: '#22C55E',
        danger:  '#EF4444',
        warning: '#F59E0B',
      }
    },
  },
  plugins: [],
}

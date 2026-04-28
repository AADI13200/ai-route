/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nebula-dark': '#0f172a',
        'nebula-primary': '#3b82f6',
        'nebula-accent': '#06b6d4',
        'nebula-success': '#10b981',
        'nebula-warning': '#f59e0b',
        'nebula-danger': '#ef4444',
        'aqi-good': '#22c55e',
        'aqi-moderate': '#eab308',
        'aqi-unhealthy-sensitive': '#f97316',
        'aqi-unhealthy': '#ef4444',
        'aqi-very-unhealthy': '#a855f7',
        'aqi-hazardous': '#7f1d1d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

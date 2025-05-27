/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banking: {
          primary: '#1e40af', // blue-800
          secondary: '#3b82f6', // blue-500
          success: '#16a34a', // green-600
          warning: '#d97706', // amber-600
          danger: '#dc2626', // red-600
        }
      }
    },
  },
  plugins: [],
}
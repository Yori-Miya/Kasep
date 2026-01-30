/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './frontend/src/**/*.{html,js}',
    './frontend/public/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        'kasep-blue': '#0ea5e9',
        'kasep-dark': '#1f2937',
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  important: true,
};

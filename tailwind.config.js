/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate900: '#1A3C4A',
        terracotta: '#C86848',
        teal: '#2E6E82',
        bgLight: '#F5F7F8',
        peach: '#FBE8DC',
        blueGray: '#D0DDE2',
        slateAlt: '#3A6878',
        slateNight: '#122830',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['var(--font-bebas)'],
        karla: ['var(--font-karla)'],
      },
      colors: {
        bg: '#050709',
        surface: '#080c0f',
        card: '#0c1218',
        border: '#141e28',
        borderhi: '#1e3040',
        green: '#00ff7f',
        amber: '#ffb347',
        red: '#ff3366',
        muted: '#4a6a80',
      },
    },
  },
  plugins: [],
}

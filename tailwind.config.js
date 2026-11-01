/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          700: '#1b2750',
          800: '#121b3b',
          900: '#0d1530',
          950: '#080e22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { '0%': { transform: 'scale(.96)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
      },
      animation: { 'fade-in': 'fadeIn .35s ease-out both', pop: 'pop .25s ease-out both' },
    },
  },
  plugins: [],
};

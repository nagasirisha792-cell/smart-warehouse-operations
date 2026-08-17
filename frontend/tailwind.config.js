/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'hsl(220, 100%, 97%)',
          100: 'hsl(220, 95%, 93%)',
          200: 'hsl(220, 90%, 85%)',
          300: 'hsl(220, 85%, 72%)',
          400: 'hsl(220, 80%, 60%)',
          500: 'hsl(220, 75%, 50%)',
          600: 'hsl(220, 80%, 42%)',
          700: 'hsl(220, 85%, 35%)',
          800: 'hsl(220, 90%, 28%)',
          900: 'hsl(220, 95%, 20%)',
          950: 'hsl(220, 100%, 13%)',
        },
        surface: {
          DEFAULT: 'hsl(220, 20%, 10%)',
          50: 'hsl(220, 15%, 18%)',
          100: 'hsl(220, 15%, 15%)',
          200: 'hsl(220, 18%, 12%)',
          300: 'hsl(220, 20%, 10%)',
          400: 'hsl(220, 22%, 8%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          black: '#050505',
          gold: '#d4af37',
          goldHover: '#b5952f',
          white: '#ffffff',
          gray: '#d9d9d9',
          darkgray: '#121212',
        }
      },
      backgroundImage: {
        'luxury-gold-gradient': 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%)',
        'luxury-gold-gradient-hover': 'linear-gradient(135deg, #d4af37 0%, #ffeb80 25%, #d4af37 50%, #ffeb80 75%, #d4af37 100%)',
      },
      fontFamily: {
        serif: ['"Marcellus"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'shimmer': 'shimmer 3s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      }
    }
  },
  plugins: [],
};
export default config;

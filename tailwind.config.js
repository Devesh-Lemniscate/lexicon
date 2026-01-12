/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        lora: ['Lora', 'Georgia', 'serif'],
        merriweather: ['Merriweather', 'Georgia', 'serif'],
        'source-serif': ['"Source Serif 4"', 'Georgia', 'serif'],
        nunito: ['Nunito', 'system-ui', 'sans-serif'],
        crimson: ['"Crimson Text"', 'Georgia', 'serif'],
      },
      colors: {
        // Warm natural palette
        paper: {
          light: '#fefefe', // Pure white
          dark: '#111111',  // Rich black
        },
        ink: {
          light: '#262626', // Warm dark
          dark: '#f5f5f5',  // Warm white
        },
        // Teal accent
        accent: '#0d9488',  // Teal
        muted: {
          light: '#a3a3a3',
          dark: '#737373',
        },
      },
      maxWidth: {
        reading: '38rem', // Slightly narrower for better reading
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
};

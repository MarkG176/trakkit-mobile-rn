/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A3AD',
          foreground: '#FFFFFF',
          light: '#E0F4F5',
        },
        background: '#FFFFFF',
        foreground: '#333333',
        'secondary-foreground': '#666666',
        muted: {
          DEFAULT: '#F8F8F8',
          foreground: '#666666',
        },
        border: '#CCCCCC',
        card: '#FFFFFF',
        accent: '#E0F4F5',
        success: '#4CAF50',
        warning: '#FFC107',
        destructive: '#F44336',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      fontFamily: {
        sans: ['Roboto_400Regular'],
        light: ['Roboto_300Light'],
        medium: ['Roboto_500Medium'],
        bold: ['Roboto_700Bold'],
      },
    },
  },
  plugins: [],
};

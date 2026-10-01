import type { Config } from 'tailwindcss';
import lineClamp from '@tailwindcss/line-clamp';

const config: Config = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#2B2B2B',
        gray: {
          500: '#5D5D5D',
          400: '#9A9A9A',
          300: '#BBBBBB',
          200: '#DDDDDD',
          100: '#EEEEEE',
          50: '#F6F6F6',
        },
        white: '#FFFFFF',
        red: '#FC5A50',
        blue: {
          DEFAULT: '#7CC5FA',
          '15%': '#E7F3FC',
        },
        main: {
          DEFAULT: '#78CA94',
          '50': '#C3E4D2',
          '15': '#EBF7EF',
        },
      },
    },
  },
  plugins: [lineClamp],
};

export default config;

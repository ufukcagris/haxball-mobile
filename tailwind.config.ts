import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'mobile-landscape': { 'raw': '(orientation: landscape) and (max-height: 600px)' },
      }
    },
  },
  plugins: [],
};
export default config;

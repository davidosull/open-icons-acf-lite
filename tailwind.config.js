/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '!./src/**/node_modules/**/*',
    './includes/**/*.php',
    './acf-open-icons.php',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

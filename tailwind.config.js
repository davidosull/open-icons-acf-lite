/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    '!./src/**/node_modules/**/*',
    './includes/**/*.php',
    './open-icons-acf.php',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

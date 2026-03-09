/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./main.tsx",
    "../*.{js,ts,jsx,tsx}",
    "../fields/*.{js,ts,jsx,tsx}",
    "../html/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

import { generatePalette } from "../../../dist/index.js";
import { frostingPlugin, getActiveColorTheme } from "../../../dist/tailwind/index.js";

const palette = generatePalette(
  { brand: ["#7C3AED", "#F59E0B"] },
  { cvdVariants: ["protanopia", "deuteranopia", "tritanopia"] },
);

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: getActiveColorTheme(),
    },
  },
  plugins: [frostingPlugin(palette)],
};

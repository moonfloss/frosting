// Palette for the app (Vite resolves frosting via alias to source).
// Tailwind config uses dist (see tailwind.config.js) to avoid symlink loops.
import { generatePalette } from "frosting";

export default generatePalette(
  { brand: ["#7C3AED", "#F59E0B"] },
  { cvdVariants: ["protanopia", "deuteranopia", "tritanopia"] },
);

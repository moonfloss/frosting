// Palette for the app (Vite resolves frosting via alias to source).
import { generatePalette } from "frosting";

export default generatePalette(
  { brand: ["#7C3AED", "#F59E0B"] },
  { cvdVariants: ["protanopia", "deuteranopia", "tritanopia"] },
);

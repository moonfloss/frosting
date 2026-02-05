import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../../..");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "frosting/tailwind", replacement: path.join(root, "src/tailwind/index.ts") },
      { find: "frosting", replacement: path.join(root, "src/index.ts") },
    ],
  },
});

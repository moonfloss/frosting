import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli/index.ts",
    "src/ui-control/index.ts",
    "src/tailwind/index.ts",
  ],
  format: ["esm"],
  dts: {
    entry: {
      index: "src/index.ts",
      "ui-control/index": "src/ui-control/index.ts",
      "tailwind/index": "src/tailwind/index.ts",
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});

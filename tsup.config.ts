import { defineConfig } from "tsup";

const sourcemap = !!process.env.SOURCEMAP;

const libraryEntries = [
  "src/index.ts",
  "src/ui-control/index.ts",
  "src/tailwind/index.ts",
  "src/chakra/index.ts",
];

const dtsEntry = {
  index: "src/index.ts",
  "ui-control/index": "src/ui-control/index.ts",
  "tailwind/index": "src/tailwind/index.ts",
  "chakra/index": "src/chakra/index.ts",
};

export default defineConfig([
  {
    entry: [...libraryEntries, "src/cli/index.ts"],
    format: ["esm"],
    dts: { entry: dtsEntry },
    splitting: false,
    sourcemap,
    clean: true,
    outDir: "dist",
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
  {
    entry: libraryEntries,
    format: ["cjs"],
    dts: { entry: dtsEntry },
    splitting: false,
    sourcemap,
    outDir: "dist",
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
]);

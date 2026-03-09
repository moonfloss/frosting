import { defineConfig } from "tsup";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as {
  version: string;
};

const sourcemap = !!process.env.SOURCEMAP;

const libraryEntries = [
  "src/index.ts",
  "src/color-utils/index.ts",
  "src/ui-control/index.ts",
  "src/tailwind/index.ts",
  "src/chakra/index.ts",
  "src/cli/api.ts",
];

const dtsEntry = {
  index: "src/index.ts",
  "color-utils/index": "src/color-utils/index.ts",
  "ui-control/index": "src/ui-control/index.ts",
  "tailwind/index": "src/tailwind/index.ts",
  "chakra/index": "src/chakra/index.ts",
  "cli/api": "src/cli/api.ts",
};

const peerExternals = ["react", "react-dom", "tailwindcss"];

export default defineConfig([
  {
    entry: [...libraryEntries, "src/cli/index.ts"],
    format: ["esm"],
    dts: { entry: dtsEntry },
    splitting: false,
    sourcemap,
    clean: true,
    outDir: "dist",
    external: peerExternals,
    define: {
      __PKG_VERSION__: JSON.stringify(packageJson.version),
    },
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
    external: peerExternals,
    define: {
      __PKG_VERSION__: JSON.stringify(packageJson.version),
    },
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
  },
]);

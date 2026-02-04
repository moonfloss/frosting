import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm"],
  dts: { entry: { index: "src/index.ts" } },
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
});

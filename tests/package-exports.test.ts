import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
  exports?: Record<string, unknown>;
};

describe("package exports", () => {
  it("declares explicit subpath exports for granular imports", () => {
    expect(packageJson.exports).toMatchObject({
      ".": expect.any(Object),
      "./color-utils": expect.any(Object),
      "./ui-control": expect.any(Object),
      "./tailwind": expect.any(Object),
      "./chakra": expect.any(Object),
      "./cli": expect.any(Object),
    });
  });
});

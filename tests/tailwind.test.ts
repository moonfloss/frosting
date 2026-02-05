import { describe, it, expect } from "vitest";
import { generatePalette } from "../src/index.js";
import {
  generateCssVars,
  getCssVarsForAddBase,
  generateTailwindTheme,
} from "../src/tailwind/index.js";

describe("generateCssVars", () => {
  it("emits :root with prefixed semantic and ramp vars for default variant", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const css = generateCssVars(palette);
    expect(css).toContain(":root {");
    expect(css).toContain("--light-default-background:");
    expect(css).toContain("--dark-default-background:");
    expect(css).toContain("--light-default-primary:");
    expect(css).toContain("--light-default-brand1-500:");
    expect(css).toContain("--light-default-neutral-950:");
    expect(css).not.toContain("--light-default-gray-"); // gray excluded
  });

  it("emits CVD variant vars when palette has variants", () => {
    const palette = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["protanopia"] },
    );
    const css = generateCssVars(palette);
    expect(css).toContain("--light-protanopia-background:");
    expect(css).toContain("--dark-protanopia-primary:");
  });

  it("respects selector option", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const css = generateCssVars(palette, { selector: ".theme-root" });
    expect(css).toContain(".theme-root {");
  });
});

describe("getCssVarsForAddBase", () => {
  it("returns object suitable for addBase with :root key", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const obj = getCssVarsForAddBase(palette);
    expect(obj).toHaveProperty(":root");
    expect(obj[":root"]).toHaveProperty("--light-default-background");
    expect(obj[":root"]["--light-default-brand1-500"]).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("generateTailwindTheme", () => {
  it("returns theme.extend-compatible colors with var() references", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateTailwindTheme(palette);
    expect(theme.colors).toHaveProperty("light-default-background");
    expect(theme.colors["light-default-background"]).toBe(
      "var(--light-default-background)",
    );
    expect(theme.colors).toHaveProperty("light-default-brand1");
    const brand1 = theme.colors["light-default-brand1"] as Record<number, string>;
    expect(brand1).toHaveProperty(500);
    expect(brand1[500]).toBe("var(--light-default-brand1-500)");
  });
});

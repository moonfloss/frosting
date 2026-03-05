import { describe, it, expect } from "vitest";
import { generatePalette } from "../src/index.js";
import {
  generateCssVars,
  getCssVarsForAddBase,
  generateTailwindTheme,
  getActiveVarStyle,
  getActiveColorTheme,
  frostingPlugin,
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

describe("generateCssVars options", () => {
  it("includeRamps: false omits ramp vars", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const css = generateCssVars(palette, { includeRamps: false });
    expect(css).toContain("--light-default-background:");
    expect(css).not.toContain("--light-default-brand1-500:");
    expect(css).not.toContain("--light-default-neutral-");
  });

  it("includeSemantic: false omits semantic vars", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const css = generateCssVars(palette, { includeSemantic: false });
    expect(css).not.toContain("--light-default-background:");
    expect(css).not.toContain("--light-default-primary:");
    expect(css).toContain("--light-default-brand1-500:");
  });
});

describe("getCssVarsForAddBase options", () => {
  it("respects custom selector", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const obj = getCssVarsForAddBase(palette, { selector: ".custom" });
    expect(obj).toHaveProperty(".custom");
    expect(obj[".custom"]).toHaveProperty("--light-default-background");
  });

  it("includeRamps: false omits ramp vars", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const obj = getCssVarsForAddBase(palette, { includeRamps: false });
    expect(obj[":root"]).toHaveProperty("--light-default-background");
    expect(obj[":root"]).not.toHaveProperty("--light-default-brand1-500");
  });

  it("includeSemantic: false omits semantic vars", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const obj = getCssVarsForAddBase(palette, { includeSemantic: false });
    expect(obj[":root"]).not.toHaveProperty("--light-default-background");
    expect(obj[":root"]).toHaveProperty("--light-default-brand1-500");
  });

  it("includes CVD variant vars", () => {
    const palette = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["protanopia"] },
    );
    const obj = getCssVarsForAddBase(palette);
    expect(obj[":root"]).toHaveProperty("--light-protanopia-background");
    expect(obj[":root"]).toHaveProperty("--light-protanopia-brand1-500");
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

  it("includeRamps: false omits ramp colors", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateTailwindTheme(palette, { includeRamps: false });
    expect(theme.colors).toHaveProperty("light-default-background");
    expect(theme.colors).not.toHaveProperty("light-default-brand1");
  });

  it("includeSemantic: false omits semantic colors", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateTailwindTheme(palette, { includeSemantic: false });
    expect(theme.colors).not.toHaveProperty("light-default-background");
    expect(theme.colors).toHaveProperty("light-default-brand1");
  });

  it("includes CVD variant colors", () => {
    const palette = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["deuteranopia"] },
    );
    const theme = generateTailwindTheme(palette);
    expect(theme.colors).toHaveProperty("light-deuteranopia-background");
    expect(theme.colors).toHaveProperty("light-deuteranopia-brand1");
  });
});

describe("getActiveVarStyle", () => {
  it("maps --active-* to var(--mode-variant-*) for semantic keys", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const style = getActiveVarStyle("light", "default", palette);
    expect(style["--active-background"]).toBe("var(--light-default-background)");
    expect(style["--active-primary"]).toBe("var(--light-default-primary)");
    expect(style["--active-foreground"]).toBe("var(--light-default-foreground)");
  });

  it("maps --active-* for ramp steps", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const style = getActiveVarStyle("dark", "default", palette);
    expect(style["--active-brand1-500"]).toBe("var(--dark-default-brand1-500)");
    expect(style["--active-neutral-50"]).toBe("var(--dark-default-neutral-50)");
  });

  it("works with CVD variant", () => {
    const palette = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["protanopia"] },
    );
    const style = getActiveVarStyle("light", "protanopia", palette);
    expect(style["--active-background"]).toBe("var(--light-protanopia-background)");
    expect(style["--active-brand1-500"]).toBe("var(--light-protanopia-brand1-500)");
  });

  it("falls back to default when variant doesn't exist", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const style = getActiveVarStyle("light", "nonexistent", palette);
    expect(style["--active-background"]).toBe("var(--light-nonexistent-background)");
  });
});

describe("getActiveColorTheme", () => {
  it("returns active-* semantic keys pointing to --active-* vars", () => {
    const colors = getActiveColorTheme();
    expect(colors["active-background"]).toBe("var(--active-background)");
    expect(colors["active-primary"]).toBe("var(--active-primary)");
    expect(colors["active-foreground"]).toBe("var(--active-foreground)");
  });

  it("returns active-* ramp shade objects", () => {
    const colors = getActiveColorTheme();
    const brand1 = colors["active-brand1"] as Record<number, string>;
    expect(brand1).toBeDefined();
    expect(brand1[500]).toBe("var(--active-brand1-500)");
    expect(brand1[50]).toBe("var(--active-brand1-50)");
    expect(brand1[950]).toBe("var(--active-brand1-950)");
  });

  it("includes all ramp names", () => {
    const colors = getActiveColorTheme();
    expect(colors).toHaveProperty("active-brand1");
    expect(colors).toHaveProperty("active-brand2");
    expect(colors).toHaveProperty("active-brand3");
    expect(colors).toHaveProperty("active-brand4");
    expect(colors).toHaveProperty("active-neutral");
  });
});

describe("frostingPlugin", () => {
  it("returns a plugin object", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const plugin = frostingPlugin(palette);
    expect(plugin).toBeDefined();
    expect(typeof plugin).toBe("object");
  });

  it("accepts options", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const plugin = frostingPlugin(palette, { selector: ".custom" });
    expect(plugin).toBeDefined();
  });
});

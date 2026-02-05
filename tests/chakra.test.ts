import { describe, it, expect } from "vitest";
import { generatePalette } from "../src/index.js";
import {
  generateChakraTheme,
  getChakraColorSchemes,
} from "../src/chakra/index.js";

describe("generateChakraTheme", () => {
  it("returns expected colors and semanticTokens structure", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateChakraTheme(palette);

    expect(theme.colors).toHaveProperty("brand1");
    expect(theme.colors.brand1).toHaveProperty(500);
    expect(theme.colors.brand1[500]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.colors).toHaveProperty("neutral");

    expect(theme.semanticTokens).toBeDefined();
    expect(theme.semanticTokens.colors).toHaveProperty("background");
    expect(theme.semanticTokens.colors.background).toEqual({
      default: expect.any(String),
      _dark: expect.any(String),
    });
    expect(theme.semanticTokens.colors).toHaveProperty("primary");
    expect(theme.semanticTokens.colors.primary.default).toMatch(/^#[0-9a-f]{6}$/i);
    expect(theme.semanticTokens.colors.primary._dark).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns different color values for variant protanopia than default", () => {
    const palette = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["protanopia"] },
    );
    const defaultTheme = generateChakraTheme(palette);
    const cvdTheme = generateChakraTheme(palette, { variant: "protanopia" });

    expect(cvdTheme.colors.brand1[500]).not.toBe(defaultTheme.colors.brand1[500]);
    expect(cvdTheme.semanticTokens.colors.primary.default).not.toBe(
      defaultTheme.semanticTokens.colors.primary.default,
    );
  });

  it("respects includeSemantic: false", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateChakraTheme(palette, { includeSemantic: false });

    expect(Object.keys(theme.semanticTokens.colors)).toHaveLength(0);
    expect(theme.colors.brand1).toBeDefined();
  });

  it("respects includeRamps: false", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateChakraTheme(palette, { includeRamps: false });

    expect(Object.keys(theme.colors)).toHaveLength(0);
    expect(theme.semanticTokens.colors.background).toBeDefined();
  });

  it("applies prefix to color and semantic keys", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const theme = generateChakraTheme(palette, { prefix: "frosting" });

    expect(theme.colors).toHaveProperty("frosting-brand1");
    expect(theme.colors).not.toHaveProperty("brand1");
    expect(theme.semanticTokens.colors).toHaveProperty("frosting-background");
    expect(theme.semanticTokens.colors).not.toHaveProperty("background");
  });
});

describe("getChakraColorSchemes", () => {
  it("returns ramp names as theme keys for colorScheme", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const schemes = getChakraColorSchemes(palette);

    expect(schemes.brand1).toBe("brand1");
    expect(schemes.neutral).toBe("neutral");
  });

  it("applies prefix when given", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const schemes = getChakraColorSchemes(palette, { prefix: "frosting" });

    expect(schemes.brand1).toBe("frosting-brand1");
  });
});

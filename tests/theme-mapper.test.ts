import { describe, expect, it } from "vitest";

import { generatePalette, mapPaletteToTheme } from "../src/index.js";

describe("mapPaletteToTheme", () => {
  it("lets explicit mappings override fuzzy selection", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const result = mapPaletteToTheme(palette, {
      template: {
        light: {
          text: {
            primary: "",
          },
        },
      },
      mappings: {
        "light.text.primary": "light.primary",
      },
    });

    expect(result.theme.light.text.primary).toBe(
      palette.modes.light.semantic.primary,
    );
    expect(
      result.diagnostics.resolved.some((r) => r.reason === "explicit"),
    ).toBe(true);
  });

  it("fills nested paths from base tokens", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const result = mapPaletteToTheme(palette, {
      template: {
        light: {
          background: "",
          foreground: "",
        },
      },
      fuzzy: { enabled: false },
    });

    expect(result.theme.light.background).toBe(
      palette.modes.light.semantic.background,
    );
    expect(result.theme.light.foreground).toBe(
      palette.modes.light.semantic.foreground,
    );
  });

  it("resolves alias tokens only when derived aliases are enabled", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const withAliases = mapPaletteToTheme(palette, {
      template: {
        light: {
          decorative: {
            negative: "",
          },
        },
      },
      fuzzy: { enabled: true, derivedAliases: true },
    });
    const withoutAliases = mapPaletteToTheme(palette, {
      template: {
        light: {
          decorative: {
            negative: "",
          },
        },
      },
      fuzzy: { enabled: true, derivedAliases: false },
    });

    expect(withAliases.theme.light.decorative.negative).toBe("#d32f2f");
    expect(withoutAliases.theme.light.decorative.negative).toBe("");
    expect(
      withoutAliases.diagnostics.unresolved.some(
        (entry) => entry.targetPath === "light.decorative.negative",
      ),
    ).toBe(true);
  });

  it("tracks missing required paths", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const result = mapPaletteToTheme(palette, {
      template: {
        light: {
          unknown: {
            token: "",
          },
        },
      },
      requiredPaths: ["light.unknown.token"],
    });

    expect(result.diagnostics.missingRequired).toEqual(["light.unknown.token"]);
  });

  it("uses MUI fallback defaults for missing status aliases", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const result = mapPaletteToTheme(palette, {
      template: {
        light: {
          status: {
            success: "",
            warning: "",
            error: "",
            info: "",
          },
        },
      },
      fuzzy: { derivedAliases: true },
    });

    expect(result.theme.light.status.success).toBe("#2e7d32");
    expect(result.theme.light.status.warning).toBe("#ed6c02");
    expect(result.theme.light.status.error).toBe("#d32f2f");
    expect(result.theme.light.status.info).toBe(
      palette.modes.light.ramps.brand1[500],
    );
  });
});

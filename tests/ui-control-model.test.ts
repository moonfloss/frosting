import { describe, expect, it } from "vitest";

import {
  mergePaletteConfigFormValues,
  valuesToPaletteInput,
  valuesToPaletteOptions,
} from "../src/ui-control/index.js";

describe("paletteConfigForm model", () => {
  it("normalizes initial values for repeated brand colors and cvd variants", () => {
    const values = mergePaletteConfigFormValues({
      brandColors: [],
      cvdVariants: ["protanopia", "protanopia", "tritanopia"],
    });

    expect(values.brandColors).toEqual(["#6366f1"]);
    expect(values.cvdVariants).toEqual(["protanopia", "tritanopia"]);
  });

  it("builds brand-mode palette input with overrides", () => {
    const values = mergePaletteConfigFormValues({
      brandColors: ["7c3aed", "#f59e0b"],
      backgroundLight: "#ffffff",
      foregroundDark: "09090b",
    });

    expect(valuesToPaletteInput(values)).toEqual({
      brand: ["#7c3aed", "#f59e0b"],
      background: { light: "#ffffff" },
      foreground: { dark: "#09090b" },
    });
  });

  it("returns null when brand-mode values do not contain a valid color", () => {
    const values = mergePaletteConfigFormValues({
      brandColors: ["wat"],
    });

    expect(valuesToPaletteInput(values)).toBeNull();
  });

  it("builds scheme-mode palette input and options", () => {
    const values = mergePaletteConfigFormValues({
      inputMode: "scheme",
      schemeKind: "triad",
      schemeBase: "7c3aed",
      schemeCount: 3,
      spreadDegrees: 42,
      secondaryChromaScale: 0.65,
      brandTint: false,
      neonChromaRolloff: false,
      cvdVariants: ["deuteranopia"],
    });

    expect(valuesToPaletteInput(values)).toEqual({
      scheme: {
        kind: "triad",
        base: "#7c3aed",
        count: 3,
        spreadDegrees: 42,
        secondaryChromaScale: 0.65,
      },
    });

    expect(valuesToPaletteOptions(values)).toEqual({
      brandTint: false,
      neonChromaRolloff: false,
      stepDepth: 1,
      easing: "linear",
      cvdVariants: ["deuteranopia"],
    });
  });
});

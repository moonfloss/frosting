import { describe, it, expect } from "vitest";
import { simulateCvd, applyCvdToModePalette } from "../src/color-utils/cvd.js";
import { generatePalette } from "../src/index.js";

describe("simulateCvd", () => {
  it("returns a valid hex for each CVD type", () => {
    const hex = "#7C3AED" as const;
    expect(simulateCvd(hex, "protanopia")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(simulateCvd(hex, "deuteranopia")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(simulateCvd(hex, "tritanopia")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("changes the color (simulation is non-identity)", () => {
    const hex = "#FF0000" as const;
    const protan = simulateCvd(hex, "protanopia");
    const deutan = simulateCvd(hex, "deuteranopia");
    const tritan = simulateCvd(hex, "tritanopia");
    expect(protan).not.toBe(hex);
    expect(deutan).not.toBe(hex);
    expect(tritan).not.toBe(hex);
  });
});

describe("applyCvdToModePalette", () => {
  it("returns a full mode palette with simulated colors", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const mode = palette.modes.light;
    const simulated = applyCvdToModePalette(mode, "deuteranopia");

    expect(simulated.ramps.brand1[500]).toBeDefined();
    expect(simulated.ramps.neutral[500]).toBeDefined();
    expect(simulated.semantic.primary).toBeDefined();
    expect(simulated.semantic.background).toBeDefined();
    expect(simulated.ramps.brand1[500]).not.toBe(mode.ramps.brand1[500]);
  });

  it("works with all three CVD types", () => {
    const palette = generatePalette({ brand: ["#7C3AED"] });
    const mode = palette.modes.light;
    for (const type of ["protanopia", "deuteranopia", "tritanopia"] as const) {
      const simulated = applyCvdToModePalette(mode, type);
      expect(simulated.ramps.brand1[500]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(simulated.semantic.primary).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("simulates brand2, brand3, brand4 when present", () => {
    const palette = generatePalette({
      brand: ["#7C3AED", "#F59E0B", "#10B981", "#EF4444"],
    });
    const mode = palette.modes.light;
    const simulated = applyCvdToModePalette(mode, "protanopia");

    expect(simulated.ramps.brand2).toBeDefined();
    expect(simulated.ramps.brand3).toBeDefined();
    expect(simulated.ramps.brand4).toBeDefined();
    expect(simulated.ramps.brand2![500]).not.toBe(mode.ramps.brand2![500]);
    expect(simulated.ramps.brand3![500]).not.toBe(mode.ramps.brand3![500]);
    expect(simulated.ramps.brand4![500]).not.toBe(mode.ramps.brand4![500]);
  });
});

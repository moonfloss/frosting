import { describe, it, expect } from "vitest";
import { generatePalette } from "../src/index.js";

describe("generatePalette", () => {
  it("produces light and dark modes with brand ramps", () => {
    const out = generatePalette({ brand: ["#7C3AED"] });

    expect(out.version).toBe("1.0.0");
    expect(out.modes.light).toBeDefined();
    expect(out.modes.dark).toBeDefined();

    const { ramps, semantic } = out.modes.light;
    expect(ramps.brand1[500]).toBe("#7C3AED");
    expect(ramps.neutral).toBeDefined();
    expect(ramps.gray).toBe(ramps.neutral);

    expect(semantic.primary).toBeDefined();
    expect(semantic.background).toBeDefined();
    expect(semantic.foreground).toBeDefined();
  });

  it("accepts 2–4 brand colors", () => {
    const out = generatePalette({
      brand: ["#7C3AED", "#F59E0B", "#10B981"],
    });
    expect(out.modes.light.ramps.brand1).toBeDefined();
    expect(out.modes.light.ramps.brand2).toBeDefined();
    expect(out.modes.light.ramps.brand3).toBeDefined();
  });

  it("scheme input derives brand anchors", () => {
    const out = generatePalette({
      scheme: { base: "#7C3AED", kind: "triad" },
    });
    expect(out.inputs.schemeUsed).toBeDefined();
    expect(out.inputs.brand.light.length).toBe(3);
    expect(out.inputs.brand.dark.length).toBe(3);
  });

  it("emits CVD variants when cvdVariants requested", () => {
    const out = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["deuteranopia"] },
    );
    expect(out.variants).toBeDefined();
    expect(out.variants!.deuteranopia).toBeDefined();
    expect(out.variants!.deuteranopia.kind).toBe("cvd");
    expect(out.variants!.deuteranopia.type).toBe("deuteranopia");
    expect(out.variants!.deuteranopia.modes.light).toBeDefined();
    expect(out.variants!.deuteranopia.modes.dark).toBeDefined();
    expect(out.variants!.deuteranopia.modes.light.semantic.primary).toBeDefined();
    expect(out.variants!.deuteranopia.modes.light.ramps.brand1[500]).toBeDefined();
  });

  it("emits multiple CVD variant types when requested", () => {
    const out = generatePalette(
      { brand: ["#7C3AED"] },
      { cvdVariants: ["protanopia", "deuteranopia", "tritanopia"] },
    );
    expect(out.variants!.protanopia.type).toBe("protanopia");
    expect(out.variants!.deuteranopia.type).toBe("deuteranopia");
    expect(out.variants!.tritanopia.type).toBe("tritanopia");
  });

  it("variants is undefined when cvdVariants not requested", () => {
    const out = generatePalette({ brand: ["#7C3AED"] });
    expect(out.variants).toBeUndefined();
  });

  it("accepts 4 brand colors", () => {
    const out = generatePalette({
      brand: ["#7C3AED", "#F59E0B", "#10B981", "#EF4444"],
    });
    expect(out.modes.light.ramps.brand1).toBeDefined();
    expect(out.modes.light.ramps.brand2).toBeDefined();
    expect(out.modes.light.ramps.brand3).toBeDefined();
    expect(out.modes.light.ramps.brand4).toBeDefined();
  });

  it("brandTint: false produces different neutrals", () => {
    const tinted = generatePalette(
      { brand: ["#7C3AED"] },
      { brandTint: true },
    );
    const untinted = generatePalette(
      { brand: ["#7C3AED"] },
      { brandTint: false },
    );
    expect(tinted.modes.light.ramps.neutral[500]).not.toBe(
      untinted.modes.light.ramps.neutral[500],
    );
  });

  it("neonChromaRolloff: false produces different ramps", () => {
    const on = generatePalette(
      { brand: ["#FF0066"] },
      { neonChromaRolloff: true },
    );
    const off = generatePalette(
      { brand: ["#FF0066"] },
      { neonChromaRolloff: false },
    );
    expect(on.modes.light.ramps.brand1[50]).not.toBe(
      off.modes.light.ramps.brand1[50],
    );
  });

  it("uses custom version from options", () => {
    const out = generatePalette(
      { brand: ["#7C3AED"] },
      { version: "2.0.0" },
    );
    expect(out.version).toBe("2.0.0");
  });

  it("does not include generatedAt", () => {
    const out = generatePalette({ brand: ["#7C3AED"] });
    expect("generatedAt" in out).toBe(false);
  });

  it("respects per-mode brand + background + foreground overrides", () => {
    const out = generatePalette({
      brand: { light: ["#7C3AED"], dark: ["#A78BFA"] },
      background: { light: "#FFFFFF", dark: "#0B0B0C" },
      foreground: { light: "#171717", dark: "#FAFAFA" },
    });
    expect(out.modes.light.semantic.background).toBe("#FFFFFF");
    expect(out.modes.dark.semantic.background).toBe("#0B0B0C");
    expect(out.modes.light.semantic.foreground).toBe("#171717");
    expect(out.modes.dark.semantic.foreground).toBe("#FAFAFA");
    expect(out.modes.light.ramps.brand1[500]).toBe("#7C3AED");
    expect(out.modes.dark.ramps.brand1[500]).toBe("#A78BFA");
  });
});

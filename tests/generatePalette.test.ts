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
});
